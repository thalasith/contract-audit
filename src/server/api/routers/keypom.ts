import { z } from "zod";
import * as keypom from "keypom-js";
import { Octokit } from "@octokit/rest";
import { env } from "~/env.mjs";
import path from "path";
import fs from "fs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import * as OpenAI from "openai";

const configuration = new OpenAI.Configuration({
  apiKey: env.OPEN_API_KEY,
});

const CONTRACT_ID = "dev-1680974591130-26022271810932";

export const keypomRouter = createTRPCRouter({
  createKeyPom: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user.id;

    await keypom.initKeypom({
      network: "testnet",
      funder: {
        accountId: env.FUNDING_ACCOUNT_ID,
        secretKey: env.FUNDING_ACOUNT_PRIVATE_KEY,
      },
    });

    const callableContracts = [CONTRACT_ID];
    const { dropId, keys } = await keypom.createTrialAccountDrop({
      numKeys: 1,
      contractBytes: [
        ...fs.readFileSync(
          path.resolve(__dirname, "../../../../../ext-wasm/trial-accounts.wasm")
        ),
      ],
      maxAttachableYoctoPerContract: ["1"],
      startingBalanceNEAR: 5,
      callableContracts: callableContracts,
      callableMethods: ["*"],
      maxAttachableNEARPerContract: [1],
      trialEndFloorYocto: "1",
      trialEndFloorNEAR: 1,
    });

    const desiredAccountId = `${dropId}-keypom.testnet`;
    const trialSecretKey = keys?.secretKeys[0] || "";
    console.log(`desiredAccountId: ${JSON.stringify(desiredAccountId)}`);
    console.log(`trialSecretKey: ${JSON.stringify(trialSecretKey)}`);

    await keypom.claimTrialAccountDrop({
      desiredAccountId: desiredAccountId,
      secretKey: trialSecretKey,
    });

    const newTrial = {
      userId: userId || "",
      keyPomAccountId: desiredAccountId,
      keyPomSecretKey: trialSecretKey,
    };

    console.log(newTrial);

    await ctx.prisma.keyPomAccount.create({
      data: newTrial,
    });

    return {
      statusCode: 200,
      message: `successfully deployed account`,
    };
  }),
  createAudit: publicProcedure
    .input(
      z.object({
        username: z.string(),
        repoName: z.string(),
        path: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const accountId = ctx.session?.user.id;

      const user = await ctx.prisma.account.findMany({
        where: { userId: accountId },
      });

      const access_token = user[0]?.access_token;
      const octokit = new Octokit({
        auth: access_token, // Replace with your access token or use an environment variable
      });

      const response = await octokit.rest.repos.getContent({
        owner: input.username,
        repo: input.repoName,
        path: input.path || "",
      });

      if (Array.isArray(response.data) || response.data.type !== "file") {
        throw new Error("Path does not point to a file");
      }

      const fileContentBase64 = response.data.content;
      const fileContent = Buffer.from(fileContentBase64, "base64").toString(
        "utf8"
      );

      const openai = new OpenAI.OpenAIApi(configuration);

      const keyPomAccount = await ctx.prisma.keyPomAccount.findFirst({
        where: {
          userId: accountId,
        },
      });

      await keypom.initKeypom({
        network: "testnet",
        funder: {
          accountId: env.FUNDING_ACCOUNT_ID,
          secretKey: env.FUNDING_ACOUNT_PRIVATE_KEY,
        },
      });

      try {
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `tell me everything that is wrong from a security standpoint about ${fileContent} which is a smart contract on the near protocol`,
            },
          ],
        });
        if (
          completion.data &&
          completion.data.choices &&
          completion.data.choices[0] &&
          completion.data.choices[0].message &&
          completion.data.choices[0].message.content
        ) {
          await keypom.trialCallMethod({
            trialAccountId: keyPomAccount?.keyPomAccountId || "",
            trialAccountSecretKey: keyPomAccount?.keyPomSecretKey || "",
            contractId: CONTRACT_ID,
            methodName: "add_audit",
            args: {
              github_name: input.repoName,
              audit_description: completion.data.choices[0].message.content,
            },
            attachedDeposit: parseNearAmount("0") || "0",
            attachedGas: "30000000000000",
          });
          return completion.data.choices[0].message.content;
        } else {
          return "No text found in response";
        }
      } catch (error) {
        console.log(error);
        return "Error";
      }
    }),
});
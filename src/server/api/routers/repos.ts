import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { Buffer } from "buffer";
import { env } from "~/env.mjs";
import * as OpenAI from "openai";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

const configuration = new OpenAI.Configuration({
  apiKey: env.OPEN_API_KEY,
});

export const reposRouter = createTRPCRouter({
  repos: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  getFile: protectedProcedure.query(async ({ ctx }) => {
    const accountId = ctx.session?.user.id as string;

    if (!accountId) {
      throw new Error("User not authenticated");
    }

    const user = await ctx.prisma.account.findMany({
      where: { userId: accountId },
    });

    const access_token = user[0]?.access_token;
    const octokit = new Octokit({
      auth: access_token, // Replace with your access token or use an environment variable
    });

    // const response = await octokit.rest.repos.listForAuthenticatedUser();
    // console.log(response.data);
    const response = await octokit.rest.repos.getContent({
      owner: "thalasith",
      repo: "decentrahoops",
      path: "contract/src/lib.rs",
    });

    if (Array.isArray(response.data) || response.data.type !== "file") {
      throw new Error("Path does not point to a file");
    }

    const fileContentBase64 = response.data.content as string;
    const fileContent = Buffer.from(fileContentBase64, "base64").toString(
      "utf8"
    );

    const openai = new OpenAI.OpenAIApi(configuration);

    // try {
    //   const completion = await openai.createChatCompletion({
    //     model: "gpt-3.5-turbo",
    //     messages: [
    //       {
    //         role: "user",
    //         content: `Tell A bit of context, this is a smart contract within the Near Protocol. Tell me everything that is wrong with the below code from a security perspective and how somebody can exploit each issue.  \n\n${fileContent}'`,
    //       },
    //     ],
    //   });

    //   console.log(completion.data.choices[0]?.message.content);
    // } catch (e) {
    //   console.log(e);
    // }
    return fileContent;
  }),
});

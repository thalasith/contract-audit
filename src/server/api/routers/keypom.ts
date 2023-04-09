import { z } from "zod";
import * as keypom from "keypom-js";
import { env } from "~/env.mjs";
import path from "path";
import fs from "fs";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { parseNearAmount } from "near-api-js/lib/utils/format";

const CONTRACT_ID = "dev-1680974591130-26022271810932";

export const keypomRouter = createTRPCRouter({
  createKeyPom: publicProcedure.query(async ({ ctx }) => {
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

    return {
      statusCode: 200,
      message: `successfully deployed account`,
    };
  }),
  createAudit: publicProcedure.query(async ({ ctx }) => {
    await keypom.initKeypom({
      network: "testnet",
      funder: {
        accountId: env.FUNDING_ACCOUNT_ID,
        secretKey: env.FUNDING_ACOUNT_PRIVATE_KEY,
      },
    });

    await keypom.trialCallMethod({
      trialAccountId: "1680994747556-keypom.testnet",
      trialAccountSecretKey:
        "2Msx1uyWd8hm1K6tvkCCaPai8yTf8dii4TMAuQrbu3UfVkkKTxyMjZxfgP6GHxdCpPsJTf5zQiX1YCXQgTRexWkw",
      contractId: CONTRACT_ID,
      methodName: "add_audit",
      args: {
        github_name: "testing keypom",
        audit_description: "testing keypom description",
      },
      attachedDeposit: parseNearAmount("0") + "",
      attachedGas: "30000000000000",
    });
    return {
      statusCode: 200,
      message: `successfully deployed account`,
    };
  }),
});

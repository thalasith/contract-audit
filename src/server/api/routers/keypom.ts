import { z } from "zod";
import * as keypom from "keypom-js";
import { env } from "~/env.mjs";
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
      contractBytes: [1000000],
      maxAttachableYoctoPerContract: ["1"],
      startingBalanceNEAR: 0.5,
      callableContracts: callableContracts,
      callableMethods: ["*"],
      maxAttachableNEARPerContract: [1],
      trialEndFloorYocto: "1000000000000000000000000",
      trialEndFloorNEAR: 0.33 + 0.3,
    });

    // const desiredAccountId = `testthalanos.testnet`;
    const trialSecretKey = keys?.secretKeys[0] || "";
    // console.log("desiredAccountId: ", desiredAccountId);
    console.log(`trialSecretKey: ${JSON.stringify(trialSecretKey)}`);

    await keypom.claimTrialAccountDrop({
      desiredAccountId: "afkljewkljrwthal.testnet",
      secretKey: trialSecretKey,
    });

    // await keypom.trialCallMethod({
    //   trialAccountId: desiredAccountId,
    //   trialAccountSecretKey: trialSecretKey,
    //   contractId: CONTRACT_ID,
    //   methodName: "account_id",
    //   args: { account_id: desiredAccountId },
    //   attachedDeposit: "0.1",
    //   attachedGas: "30000000000000",
    // });

    // await keypom.trialCallMethod({
    //   trialAccountId: desiredAccountId,
    //   trialAccountSecretKey: trialSecretKey,
    //   contractId: CONTRACT_ID,
    //   methodName: "add_audit",
    //   args: {
    //     github_name: "flight_shield",
    //     audit_description: "testing audit description",
    //   },
    //   attachedDeposit: "0.1",
    //   attachedGas: "30000000000000",
    // });
    return {
      statusCode: 200,
      message: `successfully deployed account`,
    };
  }),
});

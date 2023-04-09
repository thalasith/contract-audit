import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { Buffer } from "buffer";
import { env } from "~/env.mjs";
import * as OpenAI from "openai";
import type { RepoData, gitHubData } from "~/interfaces";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

const configuration = new OpenAI.Configuration({
  apiKey: env.OPEN_API_KEY,
});

export const reposRouter = createTRPCRouter({
  getRepoFiles: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        repoName: z.string(),
        path: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const accountId = ctx.session?.user.id;

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

      const { data: rawData } = await octokit.rest.repos.getContent({
        owner: input.username,
        repo: input.repoName,
        path: input.path || "",
      });

      const data = (rawData as gitHubData[]) || [];

      const removePathPrefix = (itemPath: string): string => {
        const pathPrefix = input.path ? `${input.path}/` : "";
        return itemPath.replace(pathPrefix, "");
      };

      const files = data
        .filter((item: gitHubData) => item.type === "file")
        .map((file: gitHubData) => removePathPrefix(file.path));

      const folders = data
        .filter((item: gitHubData) => item.type === "dir")
        .map((folder: gitHubData) => removePathPrefix(folder.path));

      return {
        files,
        folders,
      };
    }),

  getRepos: protectedProcedure.query(async ({ ctx }) => {
    const accountId = ctx.session?.user.id;

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

    const response = await octokit.rest.repos.listForAuthenticatedUser();
    const returnData = [] as RepoData[];
    response.data.forEach((repo) => {
      const dummyData = repo.full_name.split("/");
      const data = {
        id: repo.id,
        name: repo.name,
        owner: dummyData[0],
        repoName: dummyData[1],
        homePage: repo.homepage,
        github_link: repo.html_url,
      } as RepoData;
      returnData.push(data);
    });

    return returnData;
  }),

  getFile: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        repoName: z.string(),
        path: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const accountId = ctx.session?.user.id;

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
      return fileContent;
    }),
  getOpenAIPrompt: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        repoName: z.string(),
        path: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const accountId = ctx.session?.user.id;

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

      console.log(fileContent);

      const openai = new OpenAI.OpenAIApi(configuration);

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
          return completion.data.choices[0].message.content;
        } else {
          return "No text found in response";
        }
      } catch (e) {
        console.log(e);
      }
      return "testing!";
    }),
});

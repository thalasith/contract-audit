import { createTRPCRouter } from "~/server/api/trpc";
import { exampleRouter } from "~/server/api/routers/example";
import { reposRouter } from "./routers/repos";
import { keypomRouter } from "./routers/keypom";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  repos: reposRouter,
  keypom: keypomRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

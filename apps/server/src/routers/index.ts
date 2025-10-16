import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { schedulerRouter } from "./scheduler";
import { analyticsRouter } from "./analytics";

export const appRouter = router({
    healthCheck: publicProcedure.query(() => {
        return "OK";
    }),
    privateData: protectedProcedure.query(({ ctx }) => {
        return {
            message: "This is private",
            user: ctx.session.user,
        };
    }),
    scheduler: schedulerRouter,
    analytics: analyticsRouter,
});
export type AppRouter = typeof appRouter;

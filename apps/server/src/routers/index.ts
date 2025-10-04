import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { schedulerRouter } from "./scheduler";

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
});
export type AppRouter = typeof appRouter;

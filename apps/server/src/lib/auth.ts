import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../db";

const isDevelopment = process.env.NODE_ENV !== "production";

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: [process.env.CORS_ORIGIN || "", "http://localhost:3001", "http://127.0.0.1:3001"],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			// Use "lax" for development, "none" for production
			sameSite: isDevelopment ? "lax" : "none",
			// Only require secure in production
			secure: !isDevelopment,
			httpOnly: true,
		},
	},
});

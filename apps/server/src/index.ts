import { trpcServer } from "@hono/trpc-server";
import { createContext } from "./lib/context";
import { appRouter } from "./routers/index";
import { auth } from "./lib/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

// CORS configuration - use environment variable in production
const corsOrigins = process.env.CORS_ORIGIN 
	? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
	: ["http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3001", "http://127.0.0.1:3002"];

app.use(
	"/*",
	cors({
		origin: corsOrigins,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
	try {
		return await auth.handler(c.req.raw);
	} catch (error) {
		console.error("Auth error:", error);
		return c.json({ error: "Authentication failed", details: error instanceof Error ? error.message : String(error) }, 500);
	}
});

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

app.get("/health", (c) => {
	return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;
const hostname = process.env.HOST || "0.0.0.0";

console.log(`🚀 Server starting on ${hostname}:${port}`);
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Start server - check for Bun runtime first, then fallback to Node.js
const startServer = async () => {
	if (typeof Bun !== 'undefined') {
		// Use Bun's built-in server
		Bun.serve({
			fetch: app.fetch,
			port: Number(port),
			hostname: hostname,
		});
		console.log(`✅ Bun server running on http://${hostname}:${port}`);
	} else {
		// Fallback for Node.js runtime
		const { createServer } = await import('http');
		const server = createServer(async (req, res) => {
			const url = new URL(req.url!, `http://${req.headers.host}`);
			const request = new Request(url.toString(), {
				method: req.method,
				headers: req.headers as any,
				// @ts-ignore - Node.js IncomingMessage compatibility
				body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
			});
			
			const response = await app.fetch(request);
			
			res.statusCode = response.status;
			response.headers.forEach((value, key) => {
				res.setHeader(key, value);
			});
			
			const body = await response.text();
			res.end(body);
		});
		
		server.listen(Number(port), hostname, () => {
			console.log(`✅ Node.js server running on http://${hostname}:${port}`);
		});
	}
};

// Start the server
startServer().catch((error) => {
	console.error('❌ Failed to start server:', error);
	process.exit(1);
});

export default app;

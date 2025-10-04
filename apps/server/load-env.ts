// Preload environment variables for Bun
import { file } from "bun";
import path from "node:path";

const envPath = path.join(import.meta.dir, ".env");

try {
	const envFile = await file(envPath).text();
	console.log(`[env-loader] Loading .env from: ${envPath}`);
	
	let loaded = 0;
	envFile.split("\n").forEach((line) => {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith("#")) {
			const [key, ...valueParts] = trimmed.split("=");
			if (key && valueParts.length > 0) {
				const value = valueParts.join("=").trim();
				process.env[key.trim()] = value;
				console.log(`[env-loader] Loaded: ${key.trim()}`);
				loaded++;
			}
		}
	});
	
	console.log(`[env-loader] Successfully loaded ${loaded} environment variables`);
} catch (error) {
	console.error("[env-loader] Failed to load .env file:", error);
	process.exit(1);
}

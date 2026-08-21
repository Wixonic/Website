import type { Handler } from "../../Server/src/main.ts";
import { config } from "../../Server/src/config.ts";

export const handler: Handler = {
	domain: config.isDevEnvironment ? "localhost:1200" : "server.wixonic.fr",
	origin: "*",
	path: "/error",
	handle: async (req) => {
		if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
		const data = await req.json().catch(() => null);
		console.error("[Client Error Report]", data);
		return new Response(null, { status: 204 });
	}
};
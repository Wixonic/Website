import type { Handler } from "../../Server/src/main.ts";
import { config } from "../../Server/src/config.ts";

export const handler: Handler = {
	domain: config.isDevEnvironment ? "localhost:1202" : "api.onion.wixonic.fr",
	origin: config.isDevEnvironment ? "localhost:2011" : "onion.wixonic.fr",
	handle: (_req) => {
		return new Response("Hi from Onion Handler", { status: 204 });
	}
};
import type { Handler } from "../../main.ts";
import { config } from "../../config.ts";

export const handler: Handler = {
	origin: config.isDevEnvironment ? "localhost:2017" : "onion.wixonic.fr",
	handle: (_req) => {
		return new Response("Hi from Onion Handler", { status: 204 });
	}
};
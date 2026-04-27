import type { Handler } from "../../main.ts";
import { config } from "../../config.ts";

export const handler: Handler = {
	origin: config.isDevEnvironment ? "localhost:2014" : "discord.wixonic.fr",
	handle: (_req) => {
		return new Response("Hi from Discord Handler", { status: 204 });
	}
};
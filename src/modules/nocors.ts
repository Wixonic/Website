import type { Handler, Logger } from "../../Server/src/main.ts";
import { config } from "../../Server/src/config.ts";

export const handler: Handler = {
	domain: config.isDevEnvironment ? "localhost:1200" : "server.wixonic.fr",
	origin: "*",
	path: "/nocors",
	handle: async (logger: Logger, request: Request) => {
		if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405 });

		const param = new URL(request.url).searchParams.get("url");

		if (!param) return new Response(null, { status: 400 });

		try {
			const url = new URL(param);

			if (!["http:", "https:"].includes(url.protocol)) return new Response("Invalid protocol", { status: 400 });

			const response = await fetch(url.toString());

			if (!response.ok) return new Response(`Upstream error: ${response.statusText}`, {
				status: response.status,
				headers: { "Access-Control-Allow-Origin": "*" }
			});

			const body = await response.text();
			const contentType = response.headers.get("content-type") ?? "application/octet-stream";

			return new Response(body, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Access-Control-Allow-Origin": "*",
					"Cache-Control": "public, max-age=1800"
				}
			});
		} catch (error) {
			logger.warn(`No-CORS proxy error for URL "${param}":`, error);
			return new Response("Internal Server Error", {
				status: 500,
				headers: { "Access-Control-Allow-Origin": "*" }
			});
		}
	}
};
import logger from "/script/logger.js";
import { join } from "/script/path.js";
import { request } from "/script/request.js";

/** @typedef {Object} PresenceActivity
 * @property {string} name
 * @property {string} type
 */

/** @typedef {Object} Presence
 * @property {"offline"} status
 * @property {PresenceActivity[]} activities
 */

/** @typedef {Object} DiscordProfile
 * @property {string} id
 * @property {string} username
 * @property {string} displayName
 * @property {string} avatar
 * @property {string} avatarDecoration
 * @property {Presence} presence
 */

/** @returns {Promise<DiscordProfile|null>} */
export const getDiscordProfile = async () => {
	try {
		const req = await request("GET", join(path.server.discord, "/profile/?id=1020454688467980308"), "json");
		req.response.avatar = req.response.avatar.replace(".gif", ".webp")
		req.response.avatarDecoration = req.response.avatarDecoration.replace(".png", ".webp")
		return req.response
	} catch (error) {
		logger.warn("Failed to fetch Discord profile:", error);
		return null;
	}
};
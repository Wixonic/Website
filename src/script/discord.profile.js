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
		const profileRequest = await request("GET", join(path.server.discord, "/profile/?id=1020454688467980308"), "json");
		if (profileRequest.response?.avatar) profileRequest.response.avatar = profileRequest.response.avatar.replace(/\.gif(\?.*)?$/i, ".webp$1");
		if (profileRequest.response?.avatarDecoration) profileRequest.response.avatarDecoration = profileRequest.response.avatarDecoration.replace(/\.gif(\?.*)?$/i, ".webp$1").replace(/\.png(\?.*)?$/i, ".webp$1");
		return profileRequest.response;
	} catch (error) {
		logger.warn("Failed to fetch Discord profile:", error);
		return null;
	}
};
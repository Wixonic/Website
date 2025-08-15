let requestId = 0;

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const logger = (req, res, next) => {
	req.id = requestId++;
	req.logger = {
		debug: (...data) => console.log(`req${req.id}:`, ...data),
		info: (...data) => console.info(`req${req.id}:`, ...data),
		warn: (...data) => console.warn(`req${req.id}:`, ...data),
		error: (...data) => console.error(`req${req.id}:`, ...data)
	};

	req.logger.debug(req.path);

	next();
};

module.exports = logger;
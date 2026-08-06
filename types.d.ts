declare global {
	const path: {
		root: string;
		assets: string;
		links: string;
		status: string;
		server: string;

		github: {
			username: string;
		};

		firebase: {
			version: string;
			isEmulator: boolean;

			firestore?: {
				domain: string;
				port: number;
			};
		};
	};
};

export type LoggerFunction = (reason?: any, message?: any, trace?: any) => void;

export interface Logger {
	fatalError: LoggerFunction;
	error: LoggerFunction;
	warn: LoggerFunction;
};
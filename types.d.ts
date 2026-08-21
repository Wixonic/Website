declare global {
	const path: {
		root: string;
		assets: string;
		onion: string;
		links: string;
		status: string;

		server: {
			default: string;
			discord: string;
			onion: string;
		};

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

export type LoggerFunction = (reason?: string, message?: any, trace?: any) => void;
export type LoggerFatalErrorFunction = (reason?: string, message?: string, trace?: string, userFacingMessage?: string) => void;

export interface Logger {
	fatalError: LoggerFatalErrorFunction;
	error: LoggerFunction;
	warn: LoggerFunction;
};
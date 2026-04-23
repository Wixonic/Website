declare global {
	const path: {
		root: string;
		accounts: string;
		admin: string;
		assets: string;
		functions: string;
		knowledge: string;
		redirects: string;
		server: string;

		firebase?: {
			auth: string;
			firestore: {
				domain: string;
				port: number;
			};
			functions: {
				domain: string;
				port: number;
			};
			storage: {
				domain: string;
				port: number;
			};
		}
	};
}

export type LoggerFunction = (reason?: any, message?: any, trace?: any) => void;

export interface Logger {
	fatalError: LoggerFunction;
	error: LoggerFunction;
	warn: LoggerFunction;
}
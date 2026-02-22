export interface ContentMap {
	image: string;
	audio: string;
	video: string;
	json: Record<string, any>;
	text: string;
	raw: string;
}

export type ComponentType = keyof ContentMap;

export interface Component<T extends ComponentType = ComponentType> {
	id: string;
	type: T;
	url: URL;
	optional?: boolean;
}

export interface Module {
	components: Component[];
	init: () => void | Promise<void>;
	metadata?: {
		title?: string;
		description?: string;
		image?: string;
	};
}

export type LoggerFunction = (reason?: any, message?: any, trace?: any) => void;

export interface Logger {
	fatalError: LoggerFunction;
	error: LoggerFunction;
	warn: LoggerFunction;
}

declare global {
	const path: {
		root: string;
		assets: string;
		redirects: string;
		server: string;
	};
}
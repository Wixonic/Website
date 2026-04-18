declare global {
	const path: {
		root: string;
		assets: string;
		redirects: string;
		server: string;
	};
}

export interface Module {
	components: Component[];
	init: () => void | Promise<void>;
	destroy?: () => void | Promise<void>;
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

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

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
	url?: URL;
	sources?: Record<string, URL>;
	optional?: boolean;
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

export interface BannerAction {
	label: string;
	value: any;
}

export interface BannerOptions {
	message: string;
	actions: BannerAction[];
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export interface MediaOptions {
	/** Loop this item. Default: false. */
	loop?: boolean;
	/** Route video audio through AudioContext. Only relevant for video. Default: false. */
	withAudio?: boolean;
}

export interface MediaQueueItem {
	id: string;
	options: Required<MediaOptions>;
}

export interface MediaPlayer {
	playVideo: (id: string, options?: MediaOptions) => void;
	playAudio: (id: string, options?: MediaOptions) => void;
	enqueueVideo: (id: string, options?: MediaOptions) => void;
	enqueueAudio: (id: string, options?: MediaOptions) => void;
	pause: () => void;
	resume: () => void;
	stop: () => void;
	clearQueue: () => void;
	getCurrentVideoId: () => string | null;
	getCurrentAudioId: () => string | null;
	getVideoQueue: () => MediaQueueItem[];
	getAudioQueue: () => MediaQueueItem[];
	isVideoPlaying: () => boolean;
	isAudioPlaying: () => boolean;
}
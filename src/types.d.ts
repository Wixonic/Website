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
}

export interface CachedComponent<T extends ComponentType = ComponentType> {
	type: T;
	content: ContentMap[T];
}

export interface Module {
	components: Component[];
	init: () => void | Promise<void>;
}
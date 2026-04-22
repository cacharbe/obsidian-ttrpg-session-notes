// Manual mock for the 'obsidian' module.
// Obsidian is an external runtime — not available in Node. Any test that
// imports plugin source files transitively gets these stubs instead.

export class App {
	vault = {
		getAbstractFileByPath: jest.fn(),
		getFolderByPath: jest.fn(),
		read: jest.fn(),
		create: jest.fn(),
	};
	metadataCache = {
		getFileCache: jest.fn(),
	};
	workspace = {
		getLeaf: jest.fn().mockReturnValue({ openFile: jest.fn() }),
		iterateAllLeaves: jest.fn(),
	};
}

export class Modal {
	app: App;
	contentEl: { createEl: jest.Mock };
	constructor(app: App) {
		this.app = app;
		this.contentEl = { createEl: jest.fn().mockReturnValue({ createEl: jest.fn(), style: {}, addEventListener: jest.fn() }) };
	}
	open = jest.fn();
	close = jest.fn();
}

export class Plugin {
	app: App;
	settings: Record<string, unknown> = {};
	constructor(app: App) {
		this.app = app;
	}
	loadData = jest.fn().mockResolvedValue({});
	saveData = jest.fn().mockResolvedValue(undefined);
	addRibbonIcon = jest.fn().mockReturnValue({ addClass: jest.fn() });
	addSettingTab = jest.fn();
}

export class PluginSettingTab {
	app: App;
	plugin: Plugin;
	containerEl: { empty: jest.Mock; createEl: jest.Mock };
	constructor(app: App, plugin: Plugin) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = { empty: jest.fn(), createEl: jest.fn() };
	}
}

export class Setting {
	constructor(_containerEl: unknown) {}
	setName = jest.fn().mockReturnThis();
	setDesc = jest.fn().mockReturnThis();
	addDropdown = jest.fn().mockReturnThis();
	addText = jest.fn().mockReturnThis();
}

export class TFile {
	path: string;
	name: string;
	constructor(path: string) {
		this.path = path;
		this.name = path.split('/').pop() ?? path;
	}
}

export class TFolder {
	path: string;
	name: string;
	children: Array<TFile | TFolder>;
	constructor(path: string, children: Array<TFile | TFolder> = []) {
		this.path = path;
		this.name = path.split('/').pop() ?? path;
		this.children = children;
	}
}

export class Notice {
	constructor(_message: string) {}
}

export class WorkspaceLeaf {
	openFile = jest.fn();
}

export class Editor {}
export class MarkdownView {}

export const parseFrontMatterEntry = jest.fn();

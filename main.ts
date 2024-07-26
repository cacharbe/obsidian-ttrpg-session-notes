import { Console } from 'console';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import CreateSessionModal from './CreateSessionModal';
import CreateSessionSettingsTab from './CreateSessionSettings';

const DEFAULT_SETTINGS: CreateSessionPluginSettings = {
	sessionTemplate: '',
	ttrpgsFolder: '',
}

export default class CreateSessionPlugin extends Plugin {
	settings: CreateSessionPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Create Session', (evt: MouseEvent) => {
			new CreateSessionModal(this.app, this).open();
		});

		ribbonIconEl.addClass('my-plugin-ribbon-class');
		// Add the settings tab
		this.addSettingTab(new CreateSessionSettingsTab(this.app, this));
		
	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}



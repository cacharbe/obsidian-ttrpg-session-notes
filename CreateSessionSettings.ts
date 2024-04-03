import { Console } from 'console';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import CreateSessionPlugin from './main';


export default class CreateSessionSettingsTab extends PluginSettingTab {
	plugin: CreateSessionPlugin;

	constructor(app: App, plugin: CreateSessionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Session Template')
			.setDesc('The note to use as a template for new sessions')
			.addDropdown(async dropdown => {
				// Get the 'templates' folder
				let templatesFolder = this.app.vault.getAbstractFileByPath('templates');

				if (templatesFolder instanceof TFolder) {
					// Get the files in the 'templates' folder
					let templates = templatesFolder.children.filter(file => file instanceof TFile);

					// Populate the dropdown with the template names
					templates.forEach(template => {
						dropdown.addOption(template.path, template.basename);
					});

					// Set the value of the dropdown to the current template
					dropdown.setValue(this.plugin.settings.sessionTemplate);

					// When a template is selected, save it to the settings
					dropdown.onChange(async (value) => {
						console.log('Template selected:', value);
						this.plugin.settings.sessionTemplate = value;
						await this.plugin.saveSettings();
						console.log('Settings saved:', this.plugin.settings);
					});
				}
			});


	}


}

import { Console } from 'console';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import CreateSessionPlugin from './main';
import CreateSessionSettingsTab from './CreateSessionSettings';
import { parseFrontMatterEntry, parseFrontMatter } from 'obsidian';

export default class CreateSessionModal extends Modal {
	plugin: CreateSessionPlugin;
	constructor(app: App, plugin: CreateSessionPlugin) {
		super(app);
		this.plugin = plugin;
	}

	createInputDiv(form: HTMLElement, labelText: string, inputType: string = 'text'): HTMLInputElement {
		let div = form.createEl('div');
		div.style.marginBottom = '10px';  // Add some space at the bottom
		div.createEl('label', { text: labelText });
		let input = div.createEl('input');
		input.type = inputType;
		return input;
	}


	onOpen() {
		let { contentEl } = this;
		let form = contentEl.createEl('form');


		// Create a div for the campaign select
		let campaignDiv = form.createEl('div');
		campaignDiv.style.marginBottom = '10px';  // Add some space at the bottom
		campaignDiv.createEl('label', { text: 'Campaign: ' });
		let campaignSelect = campaignDiv.createEl('select');

		// Add a "SELECT CAMPAIGN" option
		let selectCampaignOption = campaignSelect.createEl('option');
		selectCampaignOption.value = '';
		selectCampaignOption.text = 'SELECT CAMPAIGN';
		selectCampaignOption.selected = true;
		selectCampaignOption.disabled = true;

		// Create a div for the session number input
		let sessionNumInput = this.createInputDiv(form, 'Session Number: ');

		// Create a div for the session title input
		let sessionTitleInput = this.createInputDiv(form, 'Session Title: ');

		// Create a div for the world input
		let worldInput = this.createInputDiv(form, 'World: ');

		// Create a div for the thread input
		let threadInput = this.createInputDiv(form, 'Thread: ');

		// Create a div for the chapter input
		let chapterInput = this.createInputDiv(form, 'Chapter: ');

		// Create a div for the location input
		let locationInput = this.createInputDiv(form, 'Location: ');

		// Create a div for the fc-date input
		let fcDateInput = this.createInputDiv(form, 'Fc-date: ');

		// Create a div for the fc-category input
		let fcCategoryInput = this.createInputDiv(form, 'Fc-category: ');


		// Get the 'ttrpgs' folder
		let ttrpgsFolder = this.app.vault.getAbstractFileByPath('ttrpgs');

		if (ttrpgsFolder instanceof TFolder) {
			// Get the subfolders (campaigns)
			let campaigns = ttrpgsFolder.children.filter(file => file instanceof TFolder);

			// Populate the campaignSelect dropdown with the campaign names
			campaigns.forEach(campaign => {
				let option = campaignSelect.createEl('option');
				option.value = campaign.name;
				option.text = campaign.name;
			});

			// When a campaign is selected, calculate the  next session number and extract other session info from pervious session frontmatter
			campaignSelect.addEventListener('change', async () => {
				let selectedCampaign = campaignSelect.value;
				let campaignFolder = this.app.vault.getAbstractFileByPath(`ttrpgs/${selectedCampaign}`);

				if (campaignFolder instanceof TFolder) {
					let sessionFiles = campaignFolder.children.filter(file => file instanceof TFile);
					let sessionNums = [];
					let mostRecentSessionFile;
					let maxSessionNum = 0;

					for (let file of sessionFiles) {
						let cache = this.app.metadataCache.getFileCache(file);
						if (cache && cache.frontmatter && cache.frontmatter.sessionNum) {
							let sessionNum = Number(cache.frontmatter.sessionNum);
							sessionNums.push(sessionNum);
							if (sessionNum > maxSessionNum) {
								maxSessionNum = sessionNum;
								mostRecentSessionFile = file;
							}
						}
					}

					let nextSessionNum = (maxSessionNum + 1).toString().padStart(2, '0');
					sessionNumInput.value = nextSessionNum;

					if (mostRecentSessionFile) {
						let cache = this.app.metadataCache.getFileCache(mostRecentSessionFile);
						let frontmatterKeys = ['world', 'thread', 'chapter', 'location', 'fc-date', 'fc-category'];
						let inputFields = [worldInput, threadInput, chapterInput, locationInput, fcDateInput, fcCategoryInput];

						frontmatterKeys.forEach((key, index) => {
							let value = key === 'fc-date' && cache.frontmatter['fc-end'] ? cache.frontmatter['fc-end'] : cache.frontmatter[key];
							inputFields[index].value = value || '';
						});
					}
				}
			});

		}

		// Create a div for the date input
		let dateDiv = form.createEl('div');
		dateDiv.style.marginBottom = '10px';  // Add some space at the bottom

		dateDiv.createEl('label', { text: 'Date: ' });
		let dateInput = dateDiv.createEl('input');
		dateInput.type = 'date';
		dateInput.valueAsDate = new Date();  // Default to today's date

		// Add a submit button
		let submitButton = form.createEl('button');
		submitButton.type = 'submit';
		submitButton.textContent = 'Create Session';

		// When the form is submitted, create a new note
		form.addEventListener('submit', async (event) => {
			event.preventDefault();

			let selectedCampaign = campaignSelect.value;

			let campaignFolder = this.app.vault.getAbstractFileByPath(`ttrpgs/${selectedCampaign}`);
			let nextSessionNum = sessionNumInput.value.toString().padStart(3, '0');
			let sessionTitle = sessionTitleInput.value;

			let date = new Date(dateInput.value);
			let selectedDate = dateInput.value;
			let year = date.getFullYear();
			let month = (date.getMonth() + 1).toString().padStart(2, '0');  // Months are 0-based in JavaScript
			let day = date.getDate().toString().padStart(2, '0');
			let formattedDate = `${year}${month}${day}`;

			if (campaignFolder instanceof TFolder) {
				// Get the template file
				let templateFile = this.app.vault.getAbstractFileByPath(this.plugin.settings.sessionTemplate);
				console.log('Template File: ', this.plugin.settings.sessionTemplate);

				if (templateFile instanceof TFile) {
					let templateContent = await this.app.vault.read(templateFile);

					// Replace template variables in templateContent...
					const templateVariables = {
						'{{campaign}}': selectedCampaign,
						'{{sessionNum}}': nextSessionNum,
						'{{date}}': selectedDate,
						'{{world}}': worldInput.value,
						'{{thread}}': threadInput.value,
						'{{chapter}}': chapterInput.value,
						'{{location}}': locationInput.value,
						'{{fc-date}}': fcDateInput.value,
						'{{fc-category}}': fcCategoryInput.value
					};

					for (let key in templateVariables) {
						templateContent = templateContent.replace(new RegExp(key, 'g'), templateVariables[key]);
					}




					let newNotePath = `ttrpgs/${selectedCampaign}/${nextSessionNum}_${formattedDate} - ${sessionTitle}.md`;
					let newNoteFile = await this.app.vault.create(newNotePath, templateContent);
					//await this.app.workspace.openNote(newNoteFile);
					let leaf = app.workspace.getLeaf(true);
					leaf.openFile(newNoteFile);
					
					this.close();
				}

			}
		});
	}

}

function getLeafWithNote(app: App, file: TFile): undefined | WorkspaceLeaf {
	let openedLeaf: WorkspaceLeaf | undefined = undefined;
	app.workspace.iterateAllLeaves((leaf) => {
		// @ts-ignore
		const leafFile = leaf.view.file as TFile;
		if (leafFile?.path === file.path) {
			openedLeaf = leaf;
		}
	});
	return openedLeaf;
}

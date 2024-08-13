/* eslint-disable @typescript-eslint/no-unused-vars */
//import { Console } from 'console';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import CreateSessionPlugin from './main';
import CreateSessionSettingsTab from './CreateSessionSettings';
//import { parseFrontMatterEntry, parseFrontMatter } from 'obsidian';
import { parseFrontMatterEntry} from 'obsidian';

export default class CreateSessionModal extends Modal {
	plugin: CreateSessionPlugin;
	constructor(app: App, plugin: CreateSessionPlugin) {
		super(app);
		this.plugin = plugin;
	}

	createInputDiv(form: HTMLElement, labelText: string, inputType = 'text'): HTMLInputElement {
		const div = form.createEl('div');
		div.style.marginBottom = '10px';  // Add some space at the bottom
		div.createEl('label', { text: labelText });
		const input = div.createEl('input');
		input.type = inputType;
		return input;
	}


	onOpen() {
		const { contentEl } = this;
		const form = contentEl.createEl('form');


		// Create a div for the campaign select
		const campaignDiv = form.createEl('div');
		campaignDiv.style.marginBottom = '10px';  // Add some space at the bottom
		campaignDiv.createEl('label', { text: 'Campaign: ' });
		const campaignSelect = campaignDiv.createEl('select');

		// Add a "SELECT CAMPAIGN" option
		const selectCampaignOption = campaignSelect.createEl('option');
		selectCampaignOption.value = '';
		selectCampaignOption.text = 'SELECT CAMPAIGN';
		selectCampaignOption.selected = true;
		selectCampaignOption.disabled = true;

		// Create a div for the session number input
		const sessionNumInput = this.createInputDiv(form, 'Session Number: ');

		// Create a div for the session title input
		const sessionTitleInput = this.createInputDiv(form, 'Session Title: ');

		// Create a div for the world input
		const worldInput = this.createInputDiv(form, 'World: ');

		// Create a div for the thread input
		const threadInput = this.createInputDiv(form, 'Thread: ');

		// Create a div for the chapter input
		const chapterInput = this.createInputDiv(form, 'Chapter: ');

		// Create a div for the location input
		const locationInput = this.createInputDiv(form, 'Location: ');

		// Create a div for the fc-date input
		const fcDateInput = this.createInputDiv(form, 'Fc-date: ');

		// Create a div for the fc-category input
		const fcCategoryInput = this.createInputDiv(form, 'Fc-category: ');


		// Get the 'ttrpgs' folder
		const ttrpgsFolder = this.app.vault.getAbstractFileByPath(this.plugin.settings.ttrpgsFolder);
		// const ttrpgsFolder = this.app.vault.getAbstractFileByPath('ttrpgs');

		if (ttrpgsFolder instanceof TFolder) {
			// Get the subfolders (campaigns)
			const campaigns = ttrpgsFolder.children.filter(file => file instanceof TFolder);

			// Populate the campaignSelect dropdown with the campaign names
			campaigns.forEach(campaign => {
				const option = campaignSelect.createEl('option');
				option.value = campaign.name;
				option.text = campaign.name;
			});

			// When a campaign is selected, calculate the  next session number and extract other session info from pervious session frontmatter
			campaignSelect.addEventListener('change', async () => {
				const selectedCampaign = campaignSelect.value;
				const campaignFolder = this.app.vault.getAbstractFileByPath(`ttrpgs/${selectedCampaign}`);

				if (campaignFolder instanceof TFolder) {
					const sessionFiles = campaignFolder.children.filter(file => file instanceof TFile);
					const sessionNums = [];
					let mostRecentSessionFile;
					let maxSessionNum = 0;

					for (const file of sessionFiles) {
						const cache = this.app.metadataCache.getFileCache(file as TFile);
						if (cache && cache.frontmatter && cache.frontmatter.sessionNum) {
							const sessionNum = Number(cache.frontmatter.sessionNum);
							sessionNums.push(sessionNum);
							if (sessionNum > maxSessionNum) {
								maxSessionNum = sessionNum;
								mostRecentSessionFile = file as TFile;
							}
						}
					}

					const nextSessionNum = (maxSessionNum + 1).toString().padStart(2, '0');
					sessionNumInput.value = nextSessionNum;

					if (mostRecentSessionFile) {
						const cache = this.app.metadataCache.getFileCache(mostRecentSessionFile);
						const frontmatterKeys = ['world', 'thread', 'chapter', 'location', 'fc-date', 'fc-category'];
						const inputFields = [worldInput, threadInput, chapterInput, locationInput, fcDateInput, fcCategoryInput];
						if (cache) {
							frontmatterKeys.forEach((key, index) => {
								if (cache.frontmatter) {
									const value = key === 'fc-date' && cache.frontmatter['fc-end'] ? cache.frontmatter['fc-end'] : cache.frontmatter[key];
									inputFields[index].value = value || '';
								}
							});
						} else {
							console.error('Cache is undefined for the most recent session file.');
						}
					}
				}
			});

		}

		// Create a div for the date input
		const dateDiv = form.createEl('div');
		dateDiv.style.marginBottom = '10px';  // Add some space at the bottom

		dateDiv.createEl('label', { text: 'Date: ' });
		const dateInput = dateDiv.createEl('input');
		dateInput.type = 'date';
		dateInput.valueAsDate = new Date();  // Default to today's date

		// Add a submit button
		const submitButton = form.createEl('button');
		submitButton.type = 'submit';
		submitButton.textContent = 'Create Session';

		// When the form is submitted, create a new note
		form.addEventListener('submit', async (event) => {
			event.preventDefault();

			const selectedCampaign = campaignSelect.value;

			const campaignFolder = this.app.vault.getAbstractFileByPath(`ttrpgs/${selectedCampaign}`);
			const nextSessionNum = sessionNumInput.value.toString().padStart(3, '0');
			const sessionTitle = sessionTitleInput.value;

			const date = new Date(dateInput.value);
			const selectedDate = dateInput.value;
			const year = date.getFullYear();
			const month = (date.getMonth() + 1).toString().padStart(2, '0');  // Months are 0-based in JavaScript
			const day = date.getDate().toString().padStart(2, '0');
			const formattedDate = `${year}${month}${day}`;

			if (campaignFolder instanceof TFolder) {
				// Get the template file
				const templateFile = this.app.vault.getAbstractFileByPath(this.plugin.settings.sessionTemplate);
				console.log('Template File: ', this.plugin.settings.sessionTemplate);

				if (templateFile instanceof TFile) {
					let templateContent = await this.app.vault.read(templateFile);

					// Replace template variables in templateContent...
					const templateVariables: { [key: string]: string } = {
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

					for (const key in templateVariables) {
						templateContent = templateContent.replace(new RegExp(key, 'g'), templateVariables[key]);
					}




					const newNotePath = `ttrpgs/${selectedCampaign}/${nextSessionNum}_${formattedDate} - ${sessionTitle}.md`;
					const newNoteFile = await this.app.vault.create(newNotePath, templateContent);
					//await this.app.workspace.openNote(newNoteFile);
					const leaf = app.workspace.getLeaf(true);
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

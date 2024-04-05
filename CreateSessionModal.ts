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
		let sessionNumDiv = form.createEl('div');
		sessionNumDiv.style.marginBottom = '10px';  // Add some space at the bottom
		sessionNumDiv.createEl('label', { text: 'Session Number: ' });
		let sessionNumInput = sessionNumDiv.createEl('input');
		//sessionNumInput.type = 'number';

		// Create a div for the session title input
		let sessionTitleDiv = form.createEl('div');
		sessionTitleDiv.style.marginBottom = '10px';  // Add some space at the bottom
		sessionTitleDiv.createEl('label', { text: 'Session Title: ' });
		let sessionTitleInput = sessionTitleDiv.createEl('input');

		// Create a div for the world input
		let worldDiv = form.createEl('div');
		worldDiv.style.marginBottom = '10px';  // Add some space at the bottom
		worldDiv.createEl('label', { text: 'World: ' });
		let worldInput = worldDiv.createEl('input');

		// Create a div for the thread input
		let threadDiv = form.createEl('div');
		threadDiv.style.marginBottom = '10px';  // Add some space at the bottom
		threadDiv.createEl('label', { text: 'Thread: ' });
		let threadInput = threadDiv.createEl('input');

		// Create a div for the chapter input
		let chapterDiv = form.createEl('div');
		chapterDiv.style.marginBottom = '10px';  // Add some space at the bottom
		chapterDiv.createEl('label', { text: 'Chapter: ' });
		let chapterInput = chapterDiv.createEl('input');

		// Create a div for the location input
		let locationDiv = form.createEl('div');
		locationDiv.style.marginBottom = '10px';  // Add some space at the bottom
		locationDiv.createEl('label', { text: 'Location: ' });
		let locationInput = locationDiv.createEl('input');

		// Create a div for the fc-date input
		let fcDateDiv = form.createEl('div');
		fcDateDiv.style.marginBottom = '10px';  // Add some space at the bottom
		fcDateDiv.createEl('label', { text: 'Fc-date: ' });
		let fcDateInput = fcDateDiv.createEl('input');

		// Create a div for the fc-category input
		let fcCategoryDiv = form.createEl('div');
		fcCategoryDiv.style.marginBottom = '10px';  // Add some space at the bottom
		fcCategoryDiv.createEl('label', { text: 'Fc-category: ' });
		let fcCategoryInput = fcCategoryDiv.createEl('input');


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
					let sessionNums = (await Promise.all(campaignFolder.children.map(async file => {
						if (file instanceof TFile) {
							let cache = this.app.metadataCache.getFileCache(file);
							if (cache && cache.frontmatter && cache.frontmatter.sessionNum) {
								return cache.frontmatter.sessionNum;
							}
						}
					}))).filter(Boolean);

					let maxSessionNum = Math.max(...sessionNums.map(Number));
					let nextSessionNum = (maxSessionNum + 1).toString().padStart(2, '0');
					// Set the value of the session number input
					sessionNumInput.value = nextSessionNum;

					let sessionFiles = campaignFolder.children.filter(file => file instanceof TFile);

					// Filter out files that do not have a sessionNum entry in the frontmatter
					sessionFiles = sessionFiles.filter(file => {
					let cache = this.app.metadataCache.getFileCache(file);
						return cache && cache.frontmatter && cache.frontmatter.sessionNum;
						});

					// Sort the session files by their sessionNum frontmatter entry in ascending order
					sessionFiles.sort(async (a, b) => {
						if (a instanceof TFile && b instanceof TFile) {
							let cacheA = this.app.metadataCache.getFileCache(a);
							let cacheB = this.app.metadataCache.getFileCache(b);

							let sessionNumA = cacheA && cacheA.frontmatter && cacheA.frontmatter.sessionNum ? cacheA.frontmatter.sessionNum : 0;
							let sessionNumB = cacheB && cacheB.frontmatter && cacheB.frontmatter.sessionNum ? cacheB.frontmatter.sessionNum : 0;

							return sessionNumA - sessionNumB;
						}

						return 0;
					});

					console.log('Session Files: ', sessionFiles);

					// Get the most recent session file
					let mostRecentSessionFile = sessionFiles[sessionFiles.length - 1];
					console.log('Most Recent Session File: ', mostRecentSessionFile);

					if (mostRecentSessionFile instanceof TFile) {
						console.log('Most Recent Session File: ', mostRecentSessionFile.name);
						let cache = this.app.metadataCache.getFileCache(mostRecentSessionFile);
						console.log('Cache: ', cache);
						// Get the frontmatter items
						let world = cache.frontmatter['world'];
						let thread = cache.frontmatter['thread'];
						let chapter = cache.frontmatter['chapter'];
						let location = cache.frontmatter['location'];

						let fcDate = cache.frontmatter['fc-end'] ? cache.frontmatter['fc-end'] : cache.frontmatter['fc-date'];

						let fcCategory = cache.frontmatter['fc-category'];

			
						// Update the input fields with the frontmatter values
						worldInput.value = world || '';
						threadInput.value = thread || '';
						chapterInput.value = chapter || '';
						locationInput.value = location || '';
						fcDateInput.value = fcDate || '';
						fcCategoryInput.value = fcCategory || '';
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
					templateContent = templateContent.replace(/{{campaign}}/g, selectedCampaign);
					templateContent = templateContent.replace(/{{sessionNum}}/g, nextSessionNum);
					templateContent = templateContent.replace(/{{date}}/g, selectedDate);
					templateContent = templateContent.replace(/{{world}}/g, worldInput.value);
					templateContent = templateContent.replace(/{{thread}}/g, threadInput.value);
					templateContent = templateContent.replace(/{{chapter}}/g, chapterInput.value);
					templateContent = templateContent.replace(/{{location}}/g, locationInput.value);
					templateContent = templateContent.replace(/{{fc-date}}/g, fcDateInput.value);
					templateContent = templateContent.replace(/{{fc-category}}/g, fcCategoryInput.value);




					let newNotePath = `ttrpgs/${selectedCampaign}/${nextSessionNum}_${formattedDate} - ${sessionTitle}.md`;
					let newNoteFile = await this.app.vault.create(newNotePath, templateContent);
				}

			}
		});
	}

}

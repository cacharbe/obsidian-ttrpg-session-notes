# Configuring Your Obsidian Vault for the Custom Plugin

This guide provides instructions on configuring your Obsidian vault for optimal use with the custom plugin designed for managing TTRPG (Tabletop Role-Playing Game) sessions. Follow these steps to set up your vault correctly.

## Prerequisites

- Ensure you have the latest version of Obsidian installed.
- Familiarize yourself with basic Obsidian operations, such as creating files and folders.
- Currently assumes the implementation of the Fantasy Calendar plugin.

## Step 1: Install the Plugin

1. Open Obsidian.
2. Go to `Settings` > `Community Plugins`.
3. Disable `Safe Mode`.
4. Click on `Browse` and search for the custom TTRPG session management plugin.
5. Install and enable the plugin.

## Step 2: Create the Required Folder Structure
The plugin currently makes several assumptions about the set up of your vault. To ensure the plugin works correctly, it is suggested that the user create the following folder structure within their vault:

- `ttrpgs/`: Root folder for TTRPG content.
  - `campaign1/`: Folder for your first campaign (rename as needed).
  - `campaign2/`: Folder for your second campaign (optional).

## Step 3: Set Up the Session Template
Along with assuming a specific folder structure, the plugin also requires a specific note template to create new session notes. This template should be a Handlebar-based note that includes the frontmatter and content structure you want for your session notes.

1. Create a new note for the session template.
2. Add the desired frontmatter and content structure. Example:

```
---
type: session
campaign: {{campaign}}
world: {{world}}
thread: {{thread}}
chapter: {{chapter}}
sessionNum: {{sessionNum}}
location: {{location}}
date: {{date}}
fc-date: {{fc-date}}

fc-category: {{fc-category}}
fc-calendar: Quarantine Qohort
long_rest: false
short_rest: false
divvy: false
summary: ""
tags: 
art: ""
---

# Session Title

## Summary

## Details

## NPCs

## Outcomes


```

3. Save the template in a known location.

## Step 4: Configure the Plugin Settings

1. Navigate to `Settings` > `Plugin Options` and select the TTRPG session management plugin.
2. Set the `Session Template` option to the path of your handlebar template note.


## Step 5: Usage

Invoke the plugin from the command palette or the assigned hotkey, select the campaign, fill in the session details, and submit to create a new session note based on your template.

## Best Practices

- **Regular Backups:** Regularly back up your Obsidian vault.
- **Consistent Naming:** Use consistent naming conventions for campaign folders and session notes.
- **Update Regularly:** Keep Obsidian and the plugin updated.

Follow these steps and best practices to ensure your Obsidian vault is correctly configured for using the custom TTRPG session management plugin.

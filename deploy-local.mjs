/**
 * Copies the three distributable plugin files (main.js, manifest.json, styles.css)
 * into the local test vault's plugin directory, simulating a manual plugin install.
 *
 * Handles the case where the target directory is a Windows junction/symlink
 * pointing back at this repo — it removes the junction first and replaces it
 * with a real directory before copying.
 */
import { copyFileSync, mkdirSync, rmdirSync, existsSync, realpathSync } from "fs";
import { resolve, join } from "path";

const VAULT_PLUGIN_DIR = join(
	"..",
	"test vaults",
	"plugin-test",
	".obsidian",
	"plugins",
	"obsidian-ttrpg-session-notes"
);

const FILES = ["main.js", "manifest.json", "styles.css"];

if (existsSync(VAULT_PLUGIN_DIR)) {
	const realVault = realpathSync(VAULT_PLUGIN_DIR);
	const realHere  = realpathSync(".");

	if (realVault === realHere) {
		// The vault plugin folder is a junction pointing at the repo itself.
		// rmdirSync (non-recursive) removes the junction without touching the target.
		rmdirSync(VAULT_PLUGIN_DIR);
		console.log("Removed junction → creating real plugin directory.");
	}
}

mkdirSync(VAULT_PLUGIN_DIR, { recursive: true });

for (const file of FILES) {
	copyFileSync(file, join(VAULT_PLUGIN_DIR, file));
	console.log(`  ✓  ${file}`);
}

console.log(`\nDeployed to: ${resolve(VAULT_PLUGIN_DIR)}`);

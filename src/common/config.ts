import { join } from "path"
import { connection } from "./connection"

export interface Config {
	obsidianVault: string
}
const defaultConfig: Config = {
	obsidianVault: join(
		`${process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"]}`,
		"Documents",
		"Obsidian Vault"
	),
}
export let globalConfig: Config = defaultConfig

connection.onDidChangeConfiguration((change) => {
	globalConfig = <Config>(change.settings.obsidian || defaultConfig)
	// Revalidate all open text documents
	// documents.all().forEach(validateTextDocument);
})

import { readFileSync, readdirSync } from "fs"
import { basename, extname, join, resolve } from "path"
import { URI } from "vscode-uri"
import { globalConfig } from "./config"

export class ObsidianNote {
	readonly uri: URI
	constructor(path: string) {
		this.uri = URI.file(resolve(path))
	}
	get content() {
		return readFileSync(this.uri.fsPath).toString()
	}
	getWikiLink(label?: string) {
		const path = this.uri.fsPath.toString()
		return `[[${basename(path).slice(0, -3)}${
			label !== undefined ? `|${label}` : ""
		}]]`
	}
}

export function getObsidianNoteFromWikiLink(
	link: string
): ObsidianNote | undefined {
	if (!/^\[\[[^\]\[]+\]\]$/.test(link)) return undefined
	const innerText = link.slice(2, -2)
	if (!innerText.includes("|")) {
		return new ObsidianNote(
			join(globalConfig.obsidianVault, `${innerText}.md`)
		)
	}
	const split = innerText.split("|")
	if (split.length !== 2) return undefined
	return new ObsidianNote(join(globalConfig.obsidianVault, `${split[0]}.md`))
}

export function getObsidianNotes(): ObsidianNote[] {
	function rec_getpaths(dirPath: string): string[] {
		const allDirents = readdirSync(dirPath, { withFileTypes: true })
		const relative_paths = []
		for (const dirent of allDirents) {
			if (dirent.isDirectory()) {
				relative_paths.push(...rec_getpaths(join(dirPath, dirent.name)))
			} else if (
				dirent.isFile() &&
				[".md"].includes(extname(dirent.name))
			) {
				relative_paths.push(join(dirPath, dirent.name))
			}
		}
		return relative_paths
	}
	return rec_getpaths(globalConfig.obsidianVault).map(
		(path) => new ObsidianNote(path)
	)
}

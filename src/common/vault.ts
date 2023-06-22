import { readFileSync, readdirSync } from "fs"
import { extname, join } from "path"
import { globalConfig } from "./config"

export interface ObsidianNote {
	/**
	relative path from obsidian vault
	 */
	location: string
	label: string
}

export function getObsidianNoteFromWikiLink(
	link: string
): ObsidianNote | undefined {
	if (!/^\[\[[^\]\[]+\]\]$/.test(link)) return undefined
	const innerText = link.slice(2, -2)
	if (!innerText.includes("|")) {
		return {
			location: `${innerText}.md`,
			label: innerText,
		}
	}
	const split = innerText.split("|")
	if (split.length !== 2) return undefined
	return {
		location: `${split[0]}.md`,
		label: split[0],
	}
}

export function getContent(note: ObsidianNote) {
	return readFileSync(
		join(globalConfig.obsidianVault, note.location)
	).toString()
}

export function getObsidianNotes(dirPath: string): ObsidianNote[] {
	const path2Note = (location: string) => ({
		location,
		label: location.slice(0, -extname(location).length),
	})
	const allDirents = readdirSync(dirPath, { withFileTypes: true })

	const relative_paths = []
	for (const dirent of allDirents) {
		if (dirent.isDirectory()) {
			const subdir = join(dirPath, dirent.name)
			relative_paths.push(
				...getObsidianNotes(subdir).map((name) => ({
					...name,
					relative_path: join(subdir, name.location),
				}))
			)
		} else if (dirent.isFile() && [".md"].includes(extname(dirent.name))) {
			relative_paths.push(path2Note(dirent.name))
		}
	}
	return relative_paths
}

import { readFileSync, readdirSync } from "fs"
import { basename, extname, join, resolve } from "path"
import { URI } from "vscode-uri"
import { globalConfig } from "./config"
import { Position, TextDocument } from "vscode-languageserver-textdocument"

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

/**
	Returns the inner string matching /\[{2}.*\]{0,2}/ around pos
*/
export function getWikiLink(pos: Position, doc: TextDocument): string | undefined {
	// Detect the last closing brackets to the left of pos
	let left_hand_side = doc.getText({
		start: { line: pos.line, character: 0 },
		end: pos,
	})
	const pos_be = left_hand_side.lastIndexOf("[[")
	if (pos_be === -1) return undefined
	left_hand_side = left_hand_side.slice(pos_be)
	if (left_hand_side.includes("]]") || !/^\S+$/u.test(left_hand_side))
		return undefined

	// Detect the last closing brackets to the left of pos
	let right_hand_side = doc.getText({
		start: pos,
		end: doc.positionAt(
			doc.offsetAt({ line: pos.line + 1, character: 0 }) - 1
		),
	})
	const pos_en = right_hand_side.indexOf("]]")
	if (pos_en === -1) return undefined
	right_hand_side = right_hand_side.slice(0, pos_en + 2)
	if (right_hand_side.includes("[[") || !/^\S+$/u.test(right_hand_side))
		return undefined

	return left_hand_side + right_hand_side
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

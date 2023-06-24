import { readFileSync, readdirSync } from "fs"
import { basename, join, resolve } from "path"
import { URI } from "vscode-uri"
import { Position, TextDocument } from "vscode-languageserver-textdocument"
import { connection } from "./connection"
import { documents } from "./documents"

let obsidianVault: string | null = null

/**
	Class representing Obsidian documents
 */
export class ObsidianNote {
	readonly uri: URI
	constructor(path: string) {
		this.uri = URI.file(resolve(path))
	}
	get content() {
		const doc = documents.get(this.uri.toString())
		if (doc) return doc.getText()
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
	@param pos Cursor position
	@param doc Document
*/
export function getWikiLinkUnderPos(
	pos: Position,
	doc: TextDocument
): string | undefined {
	// Move pos to be inside of [[ ]].
	const getchar = (pos: Position): string =>
		doc.getText({
			start: pos,
			end: { line: pos.line, character: pos.character + 1 },
		})
	if (getchar(pos) === "[")
		pos = { line: pos.line, character: pos.character + 1 }
	if (getchar(pos) === "[")
		pos = { line: pos.line, character: pos.character + 1 }
	if (getchar(pos) === "]")
		pos = { line: pos.line, character: pos.character - 1 }
	if (getchar(pos) === "]")
		pos = { line: pos.line, character: pos.character - 1 }

	// Detect the last closing brackets to the left of pos
	let left_hand_side = doc.getText({
		start: { line: pos.line, character: 0 },
		end: pos,
	})
	const pos_be = left_hand_side.lastIndexOf("[[")
	if (pos_be === -1) return undefined
	left_hand_side = left_hand_side.slice(pos_be)
	if (left_hand_side.includes("]]")) return undefined

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
	if (right_hand_side.includes("[[")) return undefined

	return left_hand_side + right_hand_side
}

/**
	convert from WikiLink string to ObsidianNote instance.
*/
export function getObsidianNoteFromWikiLink(
	link: string
): ObsidianNote | undefined {
	if (!obsidianVault) return
	if (!/^\[\[[^\]\[]+\]\]$/.test(link)) return undefined
	const innerText = link.slice(2, -2)
	if (!innerText.includes("|")) {
		return new ObsidianNote(join(obsidianVault, `${innerText}.md`))
	}
	const split = innerText.split("|")
	if (split.length !== 2) return undefined
	return new ObsidianNote(join(obsidianVault, `${split[0]}.md`))
}

/**
	All obsidian markdown documents in the workspace.
*/
export const ObsidianNotes: ObsidianNote[] = []

/**
	Reload ObsidianNotes scanning the workspace.
*/
export async function updateObsidianNotes() {
	await connection.workspace
		.getWorkspaceFolders()
		.then((workspaceFolders) => {
			if (workspaceFolders === null || workspaceFolders === undefined) {
				connection
					.sendNotification("window/showMessage", {
						type: 1,
						message:
							"Please specify the workspace to detect Obsidian Vault.",
					})
					.then(() => {
						process.exit(1)
					})
			} else if (workspaceFolders.length !== 1) {
				connection
					.sendNotification("window/showMessage", {
						type: 1,
						message: "Only one workspace is allowed.",
					})
					.then(() => {
						process.exit(1)
					})
			} else {
				obsidianVault = resolve(
					URI.parse(workspaceFolders[0].uri).fsPath
				)
			}
		})
	/**
		A function that recursively searches for .md files.
		@param dirPath Path to search
	*/
	function rec_getmds(dirPath: string) {
		const allDirents = readdirSync(dirPath, { withFileTypes: true })
		for (const dirent of allDirents) {
			if (dirent.isDirectory()) {
				rec_getmds(join(dirPath, dirent.name))
			} else if (
				dirent.isFile() &&
				dirent.name.slice(-3) === ".md"
			) {
				ObsidianNotes.push(new ObsidianNote(join(dirPath, dirent.name)))
			}
		}
	}
	rec_getmds(obsidianVault!)
}

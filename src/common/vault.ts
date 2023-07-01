import { readFileSync, readdirSync } from "fs"
import { stat } from "fs/promises"
import { basename, join, resolve } from "path"
import { URI } from "vscode-uri"
import { Position, TextDocument } from "vscode-languageserver-textdocument"
import { connection } from "./connection"
import { documents } from "./documents"
import { CompletionItem, CompletionItemKind } from "vscode-languageserver/node"
import * as matter from "gray-matter"

let obsidianVault: string | null = null

/**
	An error object when ObsidianNotes is not ready.
*/
export class VaultIsNotReadyError extends Error {
	constructor(args?: string) {
		super(args)
		Object.defineProperty(this, "name", {
			configurable: true,
			enumerable: false,
			value: this.constructor.name,
			writable: true,
		})
		if (Error.captureStackTrace)
			Error.captureStackTrace(this, NoteNotFoundError)
	}
}

/**
	An error object when Obsidian Note is not available or not found.
*/
export class NoteNotFoundError extends Error {
	constructor(public uri: URI, args?: string) {
		super(args)
		Object.defineProperty(this, "name", {
			configurable: true,
			enumerable: false,
			value: this.constructor.name,
			writable: true,
		})
		if (Error.captureStackTrace)
			Error.captureStackTrace(this, NoteNotFoundError)
	}
}

/**
	Class representing Obsidian documents.
 */
export class ObsidianNote {
	constructor(readonly uri: URI) {}
	/**
		Get the content of Obsidian note.
		Throws NoteNotFoundError if the file is not found.
	*/
	get content() {
		const doc = documents.get(this.uri.toString())
		if (doc) return doc.getText()
		try {
			return readFileSync(this.uri.fsPath).toString()
		} catch {
			throw new NoteNotFoundError(this.uri)
		}
	}
	/**
		Get wikilink string refer to this instance.
	*/
	getWikiLink(label?: string) {
		const path = this.uri.fsPath.toString()
		const name = basename(path).slice(0, -3)
		return `[[${name}${label !== undefined ? `|${label}` : ""}]]`
	}
}

/**
	Returns the inner string matching /\[{2}.*\]{0,2}/ around pos
	@param pos The cursor position.
	@param doc The document to refer to.
*/
export function getWikiLinkUnderPos(
	pos: Position,
	doc: TextDocument
): string | null {
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
	if (pos_be === -1) return null
	left_hand_side = left_hand_side.slice(pos_be)
	if (left_hand_side.includes("]]")) return null

	// Detect the last closing brackets to the left of pos
	let right_hand_side = doc.getText({
		start: pos,
		end: doc.positionAt(
			doc.offsetAt({ line: pos.line + 1, character: 0 }) - 1
		),
	})
	const pos_en = right_hand_side.indexOf("]]")
	if (pos_en === -1) return null
	right_hand_side = right_hand_side.slice(0, pos_en + 2)
	if (right_hand_side.includes("[[")) return null

	return left_hand_side + right_hand_side
}

/**
	An error object if the wikilink received is syntactically broken.
*/
export class WikiLinkBrokenError extends Error {
	constructor(public broken_link: string, args?: string) {
		super(args)
		Object.defineProperty(this, "name", {
			configurable: true,
			enumerable: false,
			value: this.constructor.name,
			writable: true,
		})
		if (Error.captureStackTrace)
			Error.captureStackTrace(this, NoteNotFoundError)
	}
}

/**
	convert from WikiLink string to ObsidianNote instance.
	Throws WikiLinkBrokenError if link is syntactically broken.
	Run updateObsidianNotes() before call it in order to look-up notes,
	or throws VaultIsNotReadyError.
	@param link wikilink string to convert.
*/
export function parseWikiLink(link: string): {
	note: ObsidianNote
	alias: string | undefined
} {
	if (!obsidianVault) throw new VaultIsNotReadyError()
	if (!/^\[\[[^\][]+\]\]$/.test(link)) throw new WikiLinkBrokenError(link)
	const innerText = link.slice(2, -2)
	if (!innerText.includes("|")) {
		return {
			note: new ObsidianNote(
				URI.file(resolve(join(obsidianVault, `${innerText}.md`)))
			),
			alias: undefined,
		}
	}
	const split = innerText.split("|")
	if (split.length !== 2) throw new WikiLinkBrokenError(link)
	return {
		note: new ObsidianNote(
			URI.file(resolve(join(obsidianVault, `${split[0]}.md`)))
		),
		alias: split[1],
	}
}

/**
	All obsidian markdown documents in the workspace.
*/
export const ObsidianNoteUrls: Set<string> = new Set()
export let ObsidianNoteCompletionItems: CompletionItem[] = []

/**
	Reload ObsidianNotes scanning the workspace.
*/
export async function updateObsidianNotes(...paths: string[]) {
	/**
		A function that recursively searches for .md files.
		@param dirPath Path to search
	*/
	function rec_getmds(dirPath: string) {
		const allDirents = readdirSync(dirPath, { withFileTypes: true })
		for (const dirent of allDirents) {
			if (dirent.isDirectory()) {
				rec_getmds(join(dirPath, dirent.name))
			} else if (dirent.isFile() && dirent.name.slice(-3) === ".md") {
				ObsidianNoteUrls.add(
					URI.file(resolve(join(dirPath, dirent.name))).toString()
				)
				ObsidianNoteCompletionItems = [...ObsidianNoteUrls].flatMap(
					(uri) => {
						const note = new ObsidianNote(URI.parse(uri))
						const content = note.content // no throws because note is auto generated.
						const parsed = matter(content)
						const aliases: (string | undefined)[] = [undefined]
						if (parsed.data.aliases)
							aliases.push(...parsed.data.aliases)
						if (parsed.data.title) aliases.push(parsed.data.title)

						return aliases.map((alias) => ({
							data: parsed.content,
							label: note.getWikiLink(alias),
							kind: CompletionItemKind.Reference,
						}))
					}
				)
			}
		}
	}
	if (paths.length === 0) {
		await connection.workspace
			.getWorkspaceFolders()
			.then((workspaceFolders) => {
				if (
					workspaceFolders === null ||
					workspaceFolders === undefined
				) {
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
		if (!obsidianVault) throw new VaultIsNotReadyError()
		rec_getmds(obsidianVault)
	} else {
		for (const path of paths) {
			const dirent = await stat(path)
			if (dirent.isDirectory()) {
				rec_getmds(path)
			} else if (dirent.isFile() && path.slice(-3) === ".md") {
				ObsidianNoteUrls.add(URI.file(resolve(path)).toString())
				ObsidianNoteCompletionItems = [...ObsidianNoteUrls].flatMap(
					(uri) => {
						const note = new ObsidianNote(URI.parse(uri))
						const content = note.content // no throws because note is auto generated.
						const parsed = matter(content)
						const aliases: (string | undefined)[] = [undefined]
						if (parsed.data.aliases)
							aliases.push(...parsed.data.aliases)
						if (parsed.data.title) aliases.push(parsed.data.title)

						return aliases.map((alias) => ({
							data: parsed.content,
							label: note.getWikiLink(alias),
							kind: CompletionItemKind.Reference,
						}))
					}
				)
			}
		}
	}
}

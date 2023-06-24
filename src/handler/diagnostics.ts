import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver/node"
import { TextDocument } from "vscode-languageserver-textdocument"

import { connection } from "../common/connection"
import { documents } from "../common/documents"
import {
	WikiLinkBrokenError,
	getObsidianNoteFromWikiLink,
} from "../common/vault"
import { existsSync } from "fs"

const MAX_PROBLEMS_COUNT = 1000

export function validateWikiLinks(textDocument: TextDocument) {
	const text = textDocument.getText()
	let probrems = 0

	const diagnostics: Diagnostic[] = []
	for (const m of text.matchAll(/\[\[[^\]\[]+?\]\]/gu)) {
		if (m.index === undefined) continue
		if (probrems++ >= MAX_PROBLEMS_COUNT) break
		try {
			const note = getObsidianNoteFromWikiLink(m[0])
			if (
				// No editing nor file exists.
				!(
					documents.get(note.uri.toString()) ||
					existsSync(note.uri.fsPath)
				)
			) {
				diagnostics.push({
					severity: DiagnosticSeverity.Warning,
					range: {
						start: textDocument.positionAt(m.index),
						end: textDocument.positionAt(m.index + m[0].length),
					},
					message: `File not found: ${note.uri}`,
					source: "obsidian",
				})
			}
		} catch (e) {
			if (e instanceof WikiLinkBrokenError)
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: {
						start: textDocument.positionAt(m.index),
						end: textDocument.positionAt(m.index + m[0].length),
					},
					message: `\`${m[0]}\` is invalid link.`,
					source: "obsidian",
				})
		}
	}
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

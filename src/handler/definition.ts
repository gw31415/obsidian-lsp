import { DefinitionParams, Location } from "vscode-languageserver"
import {
	getObsidianNoteFromWikiLink,
	getWikiLinkUnderPos,
} from "../common/vault"
import { documents } from "../common/documents"

export function onDefinition(params: DefinitionParams) {
	const doc = documents.get(params.textDocument.uri)!
	const wikilink = getWikiLinkUnderPos(
		params.position,
		documents.get(params.textDocument.uri)!
	)
	if (wikilink !== null) {
		try {
			const note = getObsidianNoteFromWikiLink(wikilink)
			return Location.create(note.uri.toString(), {
				start: doc.positionAt(0),
				end: doc.positionAt(0),
			})
		} catch {}
	}
}

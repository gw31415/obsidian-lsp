import { DefinitionParams, Location } from "vscode-languageserver"
import { getObsidianNoteFromWikiLink, getWikiLinkUnderPos } from "../common/vault"
import { documents } from "../common/documents"

export function onDefinition(params: DefinitionParams) {
	const doc = documents.get(params.textDocument.uri)!
	const wikilink = getWikiLinkUnderPos(
		params.position,
		documents.get(params.textDocument.uri)!
	)
	if (wikilink === undefined) return undefined
	const note = getObsidianNoteFromWikiLink(wikilink)
	if (note === undefined) return undefined
	return Location.create(note.uri.toString(), {
		start: doc.positionAt(0),
		end: doc.positionAt(0),
	})
}

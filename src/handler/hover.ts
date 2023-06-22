import { HoverParams, MarkupKind } from "vscode-languageserver/node"
import { documents } from "../common/documents"
import { getObsidianNoteFromWikiLink, getWikiLink } from "../common/vault"

export function onHover(params: HoverParams) {
	const wikilink = getWikiLink(
		params.position,
		documents.get(params.textDocument.uri)!
	)
	if (wikilink === undefined) return undefined
	const note = getObsidianNoteFromWikiLink(wikilink)
	if (note === undefined) return undefined

	return {
		contents: {
			kind: MarkupKind.Markdown,
			value: `${note.content}`,
		},
	}
}

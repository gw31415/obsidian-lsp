import { DefinitionParams, Location } from "vscode-languageserver"
import {
	parseWikiLink,
	getWikiLinkUnderPos,
} from "../common/vault"
import { documents } from "../common/documents"

export function onDefinition(params: DefinitionParams) {
	const doc = documents.get(params.textDocument.uri)
	if (!doc) return
	const wikilink = getWikiLinkUnderPos(params.position, doc)
	if (wikilink !== null) {
		try {
			const note = parseWikiLink(wikilink).note
			return Location.create(note.uri.toString(), {
				start: doc.positionAt(0),
				end: doc.positionAt(0),
			})
		} catch {
			return
		}
	}
}

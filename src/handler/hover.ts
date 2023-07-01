import { HoverParams, MarkupKind } from "vscode-languageserver/node"
import { documents } from "../common/documents"
import {
	NoteNotFoundError,
	WikiLinkBrokenError,
	parseWikiLink,
	getWikiLinkUnderPos,
} from "../common/vault"
import { connection } from "../common/connection"

export function onHover(params: HoverParams) {
	const doc = documents.get(params.textDocument.uri)
	if (!doc) return
	const wikilink = getWikiLinkUnderPos(params.position, doc)
	if (wikilink !== null) {
		try {
			const note = parseWikiLink(wikilink).note

			return {
				contents: {
					kind: MarkupKind.Markdown,
					value: `${note.content}`,
				},
			}
		} catch (e) {
			const params =
				e instanceof NoteNotFoundError
					? {
							type: 3,
							message: `file:\`${e.uri.fsPath}\` is not available yet.`,
					  }
					: e instanceof WikiLinkBrokenError
					? {
							type: 1,
							message: `Wikilink is broken.`,
					  }
					: null
			if (params)
				connection.sendNotification("window/showMessage", params)
		}
	}
}

import { HoverParams, MarkupKind } from "vscode-languageserver/node"
import { documents } from "../common/documents"
import {
	NoteNotFoundError,
	WikiLinkBrokenError,
	getObsidianNoteFromWikiLink,
	getWikiLinkUnderPos,
} from "../common/vault"
import { connection } from "../common/connection"

export function onHover(params: HoverParams) {
	const wikilink = getWikiLinkUnderPos(
		params.position,
		documents.get(params.textDocument.uri)!
	)
	if (wikilink !== null) {
		try {
			const note = getObsidianNoteFromWikiLink(wikilink)

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

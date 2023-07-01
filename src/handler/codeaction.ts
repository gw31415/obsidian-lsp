import {
	CodeAction,
	CodeActionKind,
	CodeActionParams,
} from "vscode-languageserver/node"
import { documents } from "../common/documents"
import { parseWikiLink, getWikiLinkUnderPos } from "../common/vault"
import { applyAlias } from "./rename"

export function onCodeAction(params: CodeActionParams) {
	const doc = documents.get(params.textDocument.uri)
	if (!doc) return

	const actions = []

	const wikilink = getWikiLinkUnderPos(params.range.start, doc)
	add_title_or_alias: if (wikilink) {
		const { alias, note } = parseWikiLink(wikilink)
		if (!alias) break add_title_or_alias

		actions.push(
			CodeAction.create(
				`Add "${alias}" as title (or alias) into ${note.uri}.`,
				applyAlias({ alias, note }),
				CodeActionKind.QuickFix
			)
		)
	}

	return actions
}

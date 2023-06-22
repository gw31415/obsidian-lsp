import { Position, TextDocument } from "vscode-languageserver-textdocument"
import { HoverParams, MarkupKind } from "vscode-languageserver/node"
import { documents } from "../common/documents"
import { getContent, getObsidianNoteFromWikiLink } from "../common/vault"

/**
	Returns the inner string matching /\[{2}.*\]{0,2}/ around pos
*/
function getWikiLink(pos: Position, doc: TextDocument): string | undefined {
	// Detect the last closing brackets to the left of pos
	let left_hand_side = doc.getText({
		start: { line: pos.line, character: 0 },
		end: pos,
	})
	const pos_be = left_hand_side.lastIndexOf("[[")
	if (pos_be === -1) return undefined
	left_hand_side = left_hand_side.slice(pos_be)
	if (left_hand_side.includes("]]") || !/^\S+$/u.test(left_hand_side))
		return undefined

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
	if (right_hand_side.includes("[[") || !/^\S+$/u.test(right_hand_side))
		return undefined

	return left_hand_side + right_hand_side
}

export function onHover(params: HoverParams) {
	const wikilink = getWikiLink(
		params.position,
		documents.get(params.textDocument.uri)!
	)
	if (wikilink === undefined) return undefined
	const note = getObsidianNoteFromWikiLink(wikilink)
	if (note === undefined) return undefined
	const content = getContent(note)
	return {
		contents: {
			kind: MarkupKind.Markdown,
			value: `${content}`,
		},
	}
}

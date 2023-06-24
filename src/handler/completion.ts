import {
	CompletionItem,
	CompletionItemKind,
	MarkupKind,
	TextDocumentPositionParams,
} from "vscode-languageserver/node"
import {
	Position,
	Range,
	TextDocument,
} from "vscode-languageserver-textdocument"

import { documents } from "../common/documents"
import { ObsidianNotes } from "../common/vault"

/**
	Returns a Range matching /\[{2}.*\]{0,2}/ around pos
*/
function getAroundBrackets(
	pos: Position,
	doc: TextDocument
): Range | undefined {
	const offset = doc.offsetAt(pos)
	const range = {
		start: { line: pos.line, character: 0 },
		end: pos,
	}

	// Detect the last closing brackets to the left of pos
	let left_hand_side = doc.getText(range)
	const pos_be = left_hand_side.lastIndexOf("[[")
	if (pos_be === -1) return undefined
	left_hand_side = left_hand_side.slice(pos_be + 2)
	if (left_hand_side.includes("]]") || !/^\S+$/u.test(left_hand_side))
		return undefined
	range.start = doc.positionAt(doc.offsetAt(range.start) + pos_be)

	/**
	 * The 2 characters immediately after the cursor
	 */
	const ending_chars = doc.getText({
		start: doc.positionAt(offset),
		end: doc.positionAt(offset + 2),
	})
	let ending_length = 0

	if (ending_chars.at(0) === "]") {
		if (ending_chars.at(1) === "]") ending_length = 2
		else ending_length = 1
	}
	range.end = doc.positionAt(doc.offsetAt(range.end) + ending_length)

	return range
}

export function onCompletion(
	textDocumentPosition: TextDocumentPositionParams
): CompletionItem[] {
	const doc = documents.get(textDocumentPosition.textDocument.uri)!

	// check cursor in brackets
	const range = getAroundBrackets(textDocumentPosition.position, doc)
	if (undefined === range) return []

	return ObsidianNotes.map((note) => {
		const newText = note.getWikiLink()

		return {
			data: note.content, // no throws because note is auto generated.
			label: newText,
			kind: CompletionItemKind.Reference,
			textEdit: {
				range,
				newText,
			},
		}
	})
}

export function onCompletionResolve(item: CompletionItem): CompletionItem {
	item.documentation = {
		kind: MarkupKind.Markdown,
		value: item.data,
	}
	return item
}

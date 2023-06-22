import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeParams,
	MarkupKind,
} from "vscode-languageserver/node"
import {
	Position,
	Range,
	TextDocument,
} from "vscode-languageserver-textdocument"
import { readFileSync, readdirSync } from "fs"
import { join, extname } from "path"

const connection = createConnection(ProposedFeatures.all)
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

interface Settings {
	obsidianVault: string
}
const defaultSettings: Settings = {
	obsidianVault: join(
		`${process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"]}`,
		"Documents",
		"Obsidian Vault"
	),
}
let globalSettings: Settings = defaultSettings

connection.onDidChangeConfiguration((change) => {
	globalSettings = <Settings>(change.settings.obsidian || defaultSettings)
	// Revalidate all open text documents
	// documents.all().forEach(validateTextDocument);
})

connection.onInitialize((_params: InitializeParams) => {
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true,
			},
		},
	}
})

interface ObsidianNote {
	path: string
	label: string
}

/**
	Returns a Range matching /\[{2}\]{0,2}/ around pos
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

connection.onCompletion(
	(textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		const doc = documents.get(textDocumentPosition.textDocument.uri)!

		// text contains string in [[]].
		let text = doc.getText({
			start: { line: textDocumentPosition.position.line, character: 0 },
			end: textDocumentPosition.position,
		})
		const pos_be = text.lastIndexOf("[[")
		if (pos_be === -1) return []
		text = text.slice(pos_be + 2)
		if (text.includes("]]") || !/^\S+$/u.test(text)) return []

		const labels = ["TypeScript", "JavaScript"]
		return labels.map((value) => ({
			label: value,
			kind: CompletionItemKind.Reference,
		}))
	}
)

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	const note: ObsidianNote = item.data
	item.documentation = {
		kind: MarkupKind.Markdown,
		value: readFileSync(
			join(globalSettings.obsidianVault, note.path)
		).toString(),
	}
	return item
})

documents.listen(connection)
connection.listen()

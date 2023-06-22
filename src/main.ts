import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeParams,
} from "vscode-languageserver/node"

import { TextDocument } from "vscode-languageserver-textdocument"
const connection = createConnection(ProposedFeatures.all)
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

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
	return item
})

documents.listen(connection)
connection.listen()

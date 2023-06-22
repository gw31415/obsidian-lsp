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
import { readFileSync, readdirSync } from "fs"
import { join, extname } from "path"

import { TextDocument } from "vscode-languageserver-textdocument"
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

import { TextDocumentSyncKind } from "vscode-languageserver/node"

import { connection } from "./common/connection"
import { documents } from "./common/documents"

import { onCompletion, onCompletionResolve } from "./handler/completion"
import { onHover } from "./handler/hover"
import { onDefinition } from "./handler/definition"
import { updateObsidianNotes } from "./common/vault"
import { validateWikiLinks } from "./handler/diagnostics"

connection.onInitialize(() => ({
	capabilities: {
		textDocumentSync: TextDocumentSyncKind.Incremental,
		completionProvider: {
			resolveProvider: true,
		},
		hoverProvider: true,
		definitionProvider: true,
		workspace: {
			workspaceFolders: {
				supported: true,
			},
		},
	},
}))

connection.onInitialized(async () => {
	await updateObsidianNotes()
	documents.all().forEach(validateWikiLinks)
})

connection.onCompletion(onCompletion)
connection.onCompletionResolve(onCompletionResolve)
connection.onDefinition(onDefinition)
connection.onHover(onHover)
documents.onDidChangeContent((change) => validateWikiLinks(change.document))

documents.listen(connection)
connection.listen()

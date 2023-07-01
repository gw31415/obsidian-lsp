#! /usr/bin/env node
import { TextDocumentSyncKind } from "vscode-languageserver/node"

import { connection } from "./common/connection"
import { documents } from "./common/documents"

import { onCompletion, onCompletionResolve } from "./handler/completion"
import { onHover } from "./handler/hover"
import { onDefinition } from "./handler/definition"
import { updateObsidianNotes } from "./common/vault"
import { validateWikiLinks } from "./handler/diagnostics"
import { URI } from "vscode-uri"
import { onRenameRequest } from "./handler/rename"

connection.onInitialize(() => ({
	capabilities: {
		textDocumentSync: TextDocumentSyncKind.Incremental,
		completionProvider: {
			resolveProvider: true,
		},
		hoverProvider: true,
		definitionProvider: true,
		renameProvider: true,
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
connection.onRenameRequest(onRenameRequest)
connection.onHover(onHover)
documents.onDidChangeContent((change) => validateWikiLinks(change.document))
documents.onDidSave((change) =>
	updateObsidianNotes(URI.parse(change.document.uri).fsPath)
)

documents.listen(connection)
connection.listen()

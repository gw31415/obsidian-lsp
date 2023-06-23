import {
	TextDocumentSyncKind,
	InitializeParams,
} from "vscode-languageserver/node"

import { connection } from "./common/connection"
import { documents } from "./common/documents"

import { onCompletion, onCompletionResolve } from "./handler/completion"
import { onHover } from "./handler/hover"
import { onDefinition } from "./handler/definition"
import { updateObsidianNotes } from "./common/vault"

connection.onInitialize((_params: InitializeParams) => {
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true,
			},
			hoverProvider: true,
			definitionProvider: true,
		},
	}
})
connection.onInitialized(updateObsidianNotes)
connection.workspace.onDidChangeWorkspaceFolders(updateObsidianNotes)

connection.onCompletion(onCompletion)
connection.onCompletionResolve(onCompletionResolve)
connection.onDefinition(onDefinition)
connection.onHover(onHover)

documents.listen(connection)
connection.listen()

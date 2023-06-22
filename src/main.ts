import {
	TextDocumentSyncKind,
	InitializeParams,
} from "vscode-languageserver/node"

import { connection } from "./common/connection"
import { documents } from "./common/documents"

import { onCompletion, onCompletionResolve } from "./handler/completion"

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

connection.onCompletion(onCompletion)
connection.onCompletionResolve(onCompletionResolve)

documents.listen(connection)
connection.listen()

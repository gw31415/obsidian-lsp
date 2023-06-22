import { ProposedFeatures, createConnection } from "vscode-languageserver/node"

export const connection = createConnection(ProposedFeatures.all)

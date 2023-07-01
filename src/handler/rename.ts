import {
	RenameParams,
	WorkspaceChange,
} from "vscode-languageserver"
import * as matter from "gray-matter"
import { documents } from "../common/documents"

export function onRenameRequest(params: RenameParams) {
	const doc = documents.get(params.textDocument.uri)
	if (!doc) return
	const change = new WorkspaceChange()

	const rawText = doc.getText()
	const doc_parsed = matter(rawText)
	const frontmatter = doc_parsed.data
	if (!("title" in frontmatter)) frontmatter["title"] = params.newName
	else {
		if (!("aliases" in frontmatter)) frontmatter["aliases"] = []
		frontmatter.aliases.push(params.newName)
	}
	change.getTextEditChange(doc.uri).replace(
		{
			start: doc.positionAt(0),
			end: doc.positionAt(rawText.length - doc_parsed.content.length),
		},
		matter.stringify("", frontmatter).slice(0, -1) // Remove the ending line break
	)
	return change.edit
}

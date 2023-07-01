import {
	RenameParams,
	WorkspaceChange,
	WorkspaceEdit,
} from "vscode-languageserver"
import { stringify }  from "gray-matter"
import * as matter  from "gray-matter"
import { TextDocument } from "vscode-languageserver-textdocument"
import { ObsidianNote } from "../common/vault"
import { URI } from "vscode-uri"

export function onRenameRequest(params: RenameParams) {
	return applyAlias({
		note: new ObsidianNote(URI.parse(params.textDocument.uri)),
		alias: params.newName,
	})
}

export function applyAlias({
	note,
	alias,
}: {
	note: ObsidianNote
	alias: string
}): WorkspaceEdit {
	const change = new WorkspaceChange()

	const rawText = note.content
	const doc: TextDocument = TextDocument.create(
		note.uri.toString(),
		"markdown",
		1,
		rawText
	)
	const doc_parsed = matter(rawText)
	const frontmatter = doc_parsed.data
	if (!("title" in frontmatter)) frontmatter["title"] = alias
	else {
		if (!("aliases" in frontmatter)) frontmatter["aliases"] = []
		frontmatter.aliases.push(alias)
	}
	change.getTextEditChange(doc.uri).replace(
		{
			start: doc.positionAt(0),
			end: doc.positionAt(rawText.length - doc_parsed.content.length),
		},
		stringify("", frontmatter).slice(0, -1) // Remove the ending line break
	)
	return change.edit
}

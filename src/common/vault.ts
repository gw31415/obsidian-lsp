import { readdirSync } from "fs"
import { extname, join } from "path"

export interface ObsidianNote {
	path: string
	label: string
}

export function getObsidianNotes(dirPath: string): ObsidianNote[] {
	const path2Note = (path: string) => ({
		path,
		label: path.slice(0, -extname(path).length),
	})
	const allDirents = readdirSync(dirPath, { withFileTypes: true })

	const relative_paths = []
	for (const dirent of allDirents) {
		if (dirent.isDirectory()) {
			const subdir = join(dirPath, dirent.name)
			relative_paths.push(
				...getObsidianNotes(subdir).map((name) => ({
					...name,
					relative_path: join(subdir, name.path),
				}))
			)
		} else if (dirent.isFile() && [".md"].includes(extname(dirent.name))) {
			relative_paths.push(path2Note(dirent.name))
		}
	}
	return relative_paths
}

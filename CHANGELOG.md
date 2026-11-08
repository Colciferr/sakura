# Changelog

Each release's notes live here. The release workflow copies the section whose
heading matches the pushed tag into the GitHub release description, and fails
the release if that section is missing.

## 1.2.2 - 2026-11-08

- README: removed the outdated multi-tree screenshot and tidied the usage text.

## 1.2.1 - 2026-11-08

- Use Obsidian's `createDiv` helper instead of `createEl("div")`, as flagged by
  the community review scan.
- Release assets (`main.js`, `manifest.json`, `styles.css`) now carry GitHub
  build-provenance attestations.
- Release notes are published with every release.
- CI builds on Node 22.

## 1.2.0 - 2026-11-08

- Removed the comment syntax. Lines starting with `#` or ` --` are now ordinary
  entries, and the gray color is gone with them.
- Pasted `tree` command output is accepted: connector glyphs (`├── └── │` and
  the ASCII `|-- `-- +--` forms) are read as indentation, and the trailing
  "N directories, M files" line is skipped.
- A leading Markdown bullet (`- `, `* `, `+ `) is dropped, so a bulleted
  outline renders as a tree.
- `***` and `___` separate trees like `---`.
- Any Unicode whitespace counts as indentation, so text pasted from web pages
  or word processors (non-breaking spaces) nests correctly.
- Leading-dot names such as `.git`, `.github`, `.vscode` are hidden folders
  instead of files. Well-known dotfiles (`.gitignore`, `.env`, ...) stay files.

## 1.1.0 - 2026-07-07

- Error-free, forgiving syntax: folders inferred from nesting, relative
  indentation, mixed tabs and spaces.
- Dialed back to a focused plugin ready for community submission.

## 1.0.1 - 2026-04-09

- Initial release.

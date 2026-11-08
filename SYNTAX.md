# Sakura Syntax Reference

Sakura turns an indented list inside a ` ```sakura ` code block into a colored
directory tree. The syntax is deliberately forgiving — when in doubt, Sakura
renders something rather than throwing an error.

## Keywords

| keyword | mandatory | description | example | notes |
| --- | --- | --- | --- | --- |
| ` ```sakura ` / ` ``` ` | yes | open fence / close fence | | |
| `<name>` | yes | one entry per line. At least one entry is required. | `documents` | A name with items nested under it is a **folder**. A bare word with no extension is also treated as a **folder**. A name with a `.extension` is a **file**. |
| `<name>/` | no | a trailing `/` explicitly marks a folder | `pictures/` | Optional — folders are detected automatically. A `/` you type is kept in the output; omit it and the folder still renders, just without the slash. Type it to mark an empty folder whose name *looks* like a file. |
| indentation | no | nest an entry under the line above by indenting it | `    notes.txt` | Tabs or spaces, either one. Widths don't have to be consistent and tabs/spaces may be mixed — Sakura reads depth from *relative* nesting, not exact width. |
| `<name>.<ext>` | no | a file extension sets the entry's color | `settings.json` | See the color map below. |
| `---` | no | separator between independent trees | | Place between two trees to render them as separate blocks. Three or more dashes work, and trailing text after a space (`--- part two`) is ignored. The other Markdown horizontal rules, `***` and `___`, separate trees too. |
| `...` | no | ellipsis — stands in for an unspecified number of entries | | Allowed anywhere, as many times as needed. Two or more dots (`..`, `....`) and the unicode `…` (what phones autocorrect `...` into) all count. |
| `- <name>` | no | a Markdown bullet marker in front of an entry is ignored | `- notes.txt` | `-`, `*`, and `+` followed by a space are all dropped, so an existing bulleted outline becomes a tree just by changing the fence language to `sakura`. |
| `├── <name>` | no | tree connector glyphs are read as indentation | `│   └── a.ts` | Paste the output of the `tree` command (or any hand-drawn tree using `├── └── │`, or the ASCII forms `\|-- `, `` `-- ``, `+-- `) and it renders as if it had been typed with indentation. The trailing "2 directories, 3 files" summary line is skipped. |

## File extension color map

| category | extensions | color |
| --- | --- | --- |
| root directory | | gold |
| all other dirs | | yellow |
| executables & scripts | .exe, .ps1, .sh, .bat, .cmd, .py, .rb, .pl, .lua, .php, .jar, .msi | blue |
| data & config | .json, .xml, .yaml, .yml, .toml, .csv, .env, .ini, .config, .yang, .conf, .cfg, .properties | green |
| web | .html, .htm, .css, .scss, .less, .vue, .svelte | light blue |
| source code | .ts, .js, .jsx, .tsx, .c, .cpp, .h, .cs, .go, .rs, .java, .kt, .swift, .zig, .sql | blue-gray |
| documentation | .md, .rst, .adoc, .tex, .mdx | purple |
| documents, archives & media | .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .odt, .ods, .odp, .zip, .tar, .gz, .7z, .iso, .dmg, .img, .png, .jpg, .jpeg, .gif, .bmp, .ico, .webp, .svg, .mp3, .mp4, .wav | red |
| sakura | .sakura | pink |
| ellipsis | ... | white |
| plain text & everything else | .txt, .log, unknown extensions, ... | white |

## Valid examples

### A basic tree

A root folder called "home" with two subfolders. No trailing slashes needed —
`documents` and `scripts` are folders because things are nested under them.

**Input**
```
```sakura
home
    documents
        notes.txt
    scripts
```
```
**Output**
```
home
├── documents
│   └── notes.txt
└── scripts
```

### Keeping the slashes

Type the `/` yourself and Sakura keeps it — useful when you want the explicit
file-tree look. Omit it and the folder still renders, just without a slash.

**Input**
```
```sakura
home/
    documents/
        notes.txt
    scripts/
```
```
**Output**
```
home/
├── documents/
│   └── notes.txt
└── scripts/
```

### Folders, subfolders, and files

**Input**
```
```sakura
home
    documents
        notes.txt
    scripts
        program.exe
        script.py
```
```
**Output**
```
home
├── documents
│   └── notes.txt
└── scripts
    ├── program.exe
    └── script.py
```

### Multiple trees

Top-level folders can stand side by side. Use `---` to render two unrelated
trees as separate blocks.

**Input**
```
```sakura
home
    documents
    scripts
---
shared
    games
    pictures
```
```
**Output**
```
home
├── documents
└── scripts

shared
├── games
└── pictures
```

Note `pictures` has no slash and no children, yet still counts as a folder —
a bare word with no extension is treated as one by default (you'd see it in
the folder color).

### Ellipsis

`...` implies more entries exist without listing them.

**Input**
```
```sakura
scripts
    powershell
        helloWorld.ps1
        ...
```
```
**Output**
```
scripts
└── powershell
    ├── helloWorld.ps1
    └── ...
```

## How forgiving is it?

These all used to be errors and now just render:

- **Missing trailing slashes** — folders are inferred from nesting, and any bare extensionless word is treated as a folder.
- **Inconsistent indentation** — 2 spaces here, 6 there; depth is relative.
- **Mixed tabs and spaces** — treated interchangeably.
- **Multiple root folders** — rendered as siblings, no extra syntax needed.
- **Unusual filename characters** (`< > : " | ? *`, `#`, `--`) — rendered as-is.
- **Non-breaking spaces** — text pasted from a web page, word processor, or chat app often indents with U+00A0 instead of a normal space; it counts as indentation all the same.
- **Markdown bullets** — a leading `- `, `* `, or `+ ` is dropped, so a bulleted outline is already a valid tree.
- **Pasted `tree` output** — connector glyphs (`├── └── │`) and their ASCII equivalents are read as indentation, and the "N directories, M files" summary line is skipped.
- **Hidden folders** — `.git`, `.github`, `.vscode`, `.obsidian` and other leading-dot names are folders, not files with a strange extension.

## Remaining rules

There are no errors — every input renders. What's left is how entries are
classified:

- **Empty fence** — renders nothing.
- **A bare leaf with no extension** is treated as a folder, with two
  exceptions that stay files: the classic build files (`Makefile`,
  `Dockerfile`, `Gemfile` and friends — any capitalization), and well-known
  names typed in ALL CAPS (`README`, `LICENSE`, `TODO`, `CHANGELOG`,
  `VERSION`, ...). Caps signal the intent: `TODO` is a file, `todo` is a
  folder. Anything with a `.extension` is a file.
- **Multiple dots in a name** (`archive.tar.gz`) — the last extension wins.
  This also means a dotted *folder* name with nothing nested under it
  (`com.example.app`, `v1.2`, `2024.01`) is read as a file. Give it children
  or type a trailing slash (`v1.2/`) to make it a folder.
- **Leading-dot names** (`.github`, `.git`, `.vscode`, `.config`) are hidden
  folders when the leading dot is the only one. Well-known dotfiles stay files:
  `.gitignore`, `.gitattributes`, `.editorconfig`, `.npmrc`, `.nvmrc`,
  `.prettierrc`, `.eslintrc`, `.babelrc`, `.env`, `.htaccess`, `.bashrc`,
  `.zshrc`, `.profile`, `.vimrc` and friends. A dotfile with a further
  extension (`.eslintrc.json`, `.env.local`) is an ordinary file, colored by
  its last extension.
- **No extension, or an unknown extension** — renders white, like plain text.

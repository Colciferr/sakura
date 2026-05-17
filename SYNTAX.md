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
| `#` | no | comment — rendered in gray in the output | `# this is a comment` | Works as a full line or at the end of a line. Text after a `#` mid-name is treated as a comment. |
| ` --` | no | hidden comment — removed entirely, never rendered | `notes.txt -- TODO` | Needs a space before `--`. A full line starting with `--` is dropped. |
| `---` | no | separator between independent trees | | Place between two trees to render them as separate blocks. |
| `...` | no | ellipsis — stands in for an unspecified number of entries | | Allowed at any sub-level, as many times as needed. Not allowed at the root. |

## File extension color map

| category | extensions | color |
| --- | --- | --- |
| root directory | | gold |
| all other dirs | | yellow |
| plain text | .txt, .log, .out | white |
| executables & scripts | .exe, .ps1, .sh, .bat, .cmd, .py, .rb, .pl, .lua, .php, .jar, .msi | blue |
| data & config formats | .json, .xml, .yaml, .yml, .toml, .csv, .env, .ini | green |
| config files | .config, .yang, .conf, .cfg, .properties | cyan |
| web | .html, .htm, .css, .scss, .less, .vue, .svelte | light blue |
| source code | .ts, .js, .jsx, .tsx, .c, .cpp, .h, .cs, .go, .rs, .java, .kt, .swift, .zig, .sql | blue-gray |
| documentation | .md, .rst, .adoc, .tex, .mdx | purple |
| documents, archives & media | .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .odt, .ods, .odp, .zip, .tar, .gz, .7z, .iso, .dmg, .img, .png, .jpg, .jpeg, .gif, .bmp, .ico, .webp, .svg, .mp3, .mp4, .wav | red |
| sakura | .sakura | pink |
| ellipsis | ... | white |
| comments | # | gray |
| (default) | | gray |

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
- **Unusual filename characters** (`< > : " | ? *`) — rendered as-is.

## Remaining rules

- **Empty fence** — renders nothing.
- **A bare leaf with no extension** is treated as a folder. The exceptions are
  well-known extensionless files — `README`, `LICENSE`, `Dockerfile`,
  `Makefile`, `CHANGELOG`, `Gemfile` and similar — which stay files. Anything
  with a `.extension` is a file.
- **`...` at the root level** is the one hard error — an ellipsis means "more
  siblings here", which is meaningless with no parent folder.
- **Multiple dots in a name** (`archive.tar.gz`) — the last extension wins.
- **No extension, or an unknown extension** — defaults to gray.

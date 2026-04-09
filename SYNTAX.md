# Sakura Syntax Reference 

| keyword | mandatory | description | example | notes |
| --- | --- | --- | --- | --- |
| ` ```sakura ` / ` ``` ` | yes | open fence / close fence | | |
| `target: <filepath>` | no | defines where the tree will go in the file system | `target: 'C:/temp'` | path must be in quotes. spaces OK. accepts both `/` and `\`. when present, target path acts as the implicit root and multiple top-level entries are allowed. V1: Display only. V2: can build tree at specified target path, should it exist. |
| `<dirname>/` | yes | specify root folder name. trailing `/` indicates a directory | `home/` | must define a root folder at a minimum. required when no `target` is specified. |
| `<tab>` | no |one tab character specifies a lower level of the directory. subsequent tabs indicate subsequent levels | `<tab> documents/` | indentation may use spaces or tab characters. the indent unit is determined by the first indented line and must be consistent throughout the tree. mixing tabs and spaces is not supported and will be treated as an error. |
| `<tab> <dirname>/` | no | a full tab + name + `/` indicates a child folder | `<tab> pictures/` | |
| `<tab> <filename>` | no |a name without `/` indicates a file | `<tab> notes` | all files belong to a folder, so all files must begin with at least one tab. | 
| `<tab> <filename>.<type>` | no |specify a file with a certain type | `<tab> settings.json` | all files and folders are color-coded. file type will determine color. |
| `#` | no | single-line comment | `# this is a comment` | notes |
| `.\` | no | used with the `target:` parameter to refer to the root folder of the previous tree | `target: .\documents` | |
| `---` | no | separate tree structures | | place between trees. another, separate tree can be built beneath it if you need multiple trees with different root folders. especially useful when the `target:` parameter is different for each tree. |  
| `...` | no | used to indicate an indeterminant amount of folders not listed | | place before or after list of folders/files |

## File extensions color map

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

### Creating a basic tree 

Create a root folder called "home", and two subfolders.

**Valid input**
```
```sakura
home/                   # root folder
    documents/          # tab + / indicating subdirectory
    scripts/
```                     # close fence
```
**Expected output**
```
home/
├── documents/
└── scripts/
```

Every new tree must begin with and include a root folder at a minimum.

### Creating a tree with a folder, subfolders, and files

Create root, subfolders, and files within those subfolders.

**Valid input**
```
```sakura
home/
    documents/
        notes.txt       # one tab for each level
    scripts/
        program.exe
        script.py
```                     # close fence
```

**Expected output**
```
home/
├── documents/
|   └── notes.txt
└── scripts/
    ├── program.exe
    └── script.py
```

Files and folders may contain any valid Windows filename character. 

### Specify a target directory for the tree

Specifies where the tree will go once its built. 

**Valid input**
```
```sakura
target: 'C:\temp'
root/                   # root filepath would look like 'C:\temp\root'
    subdir/
        file
```                     # close fence
```

**Expected output**
```
C:/temp
root/                   
└── subdir/
    └── file
```

A new tree may be defined anywhere within the existing file system, if so desired. 

### Creating multiple trees 

Creates two root folders called "home" and "shared" with subfolders and files. 

**Valid input**
```
```sakura
target: 'C:\'
home/
    documents/
        notes.txt
    scripts/
        program.exe
        script.py
---                     # indicates the end of the previous tree and the beginning of a new one
target: 'C:\temp'
shared/
    games/
        oldschoolrunescape.exe
        soliatire.exe
    pictures/
```                     # close
```
**Expected output** 
```
C:\
home/
├── documents/
|   └── notes.txt
└── scripts/
    ├── program.exe
    └── script.py

C:\temp
shared/
├── games/
|   ├── oldschoolrunescape.exe
|   └── solitaire.exe
└── pictures/
```
Every new tree must begin with a root directory. 

Setting targets is also useful for deep nests, to maintain readability. 

**Valid input**
```
```sakura
target: 'C:\users'
accounts/
    bowser/
    link/
        documents/
    lucina/
    mario/
    marth/
---
target: '.\link'    # '.\' can be used to reference the root in the previous tree
documents/
    music/
        john williams/
        MFDOOM/
    school/
        history/
        math/
        science/
    work/
        job applications/
---
target: '.\music\john williams'     # the last directory in the target: filepath is treated as this tree's "root" folder
star wars/
    theme.mp3
indiana jones/
    theme.mp3
```                 # close fence
```

**Expected output** 
```
C:\users
accounts/
├── bowser/
├── link/
|   └── documents/
├── lucina/
├── mario/
└── marth/

link/documents/
├── music/
|   ├── john williams/
|   └── MFDOOM/
├── school/
|   ├── history/
|   ├── math/
|   └── science/
└── work/
    └── job applications/

link/documents/music/john williams/
├── star wars/
|  └── theme.mp3
└── indiana jones/
    └── theme.mp3
```

`.\` references are not validated against previous trees. The target path is used as-is for display purposes.

### Referring to non-existent objects 

`...` can be used to imply that more files/folders may be added in the future, or the true number of files is too repetitive to meaningfully recreate here. 

**Valid input**
```
```sakura
scripts/
    powershell/
        helloWorld.ps1
        new-script.ps1
        ...                 # represents an unknown number of files similar to those preceding it, 
                            # or unrelated to the needs of the diagram entirely
```                         # close fence
```

**Expected output**
```
scripts/
└── powershell/
    ├── helloWorld.ps1
    ├── new-script.ps1
    └── ...
```

## Edge cases

### Structural errors
- No root defined. Open fence with first line indented. 
    - Syntax error. No root specified. 
- Multiple roots without `---` separator. 
    - Syntax error when no `target` is specified. 
- Indentation skips a level. E.g., goes from 1 unit to 3 units with nothing at 2.
    - Syntax error. Improper indentation resulting in orphaned objects. 
- Mixing tabs and spaces in the same tree
    - Syntax error. Sakura will use first indentation it sees and expect that in the rest of the tree.
- Empty fence.
    - No output. 

### `target:` errors
- `target` defined but path is empty. 
    - Sakura treats it as though no target parameter exists. 
- `target` defined mid-tree instead of before the root.
    - "Unexpected target" error is thrown.  
- `.\` used in first tree where there's no previous root to reference.
    - Treated just like an empty target parameter. 
- `.\` resolves to a folder not defined in the previous tree.
    - The `target` parameter can reference any filepath regardless of if its real or not. It just can't reference files/folders in a previous tree that are not defined in that tree already. This is to avoid accidental inconsistencies in the finished tree and aid readability. 
- Two `target` declarations in the same tree block. 
    - Second `target` declaration treated the same as a `target` declared mid-tree. Throws an error. 

### Naming 
- Any files names supported by Windows are supported by Sakura. 
    V1: Filenames disallowed by Windows will throw syntax errors. 
    V2: OS agnostic. Any valid filename characters are allowed. 
- Filename with no extension and no `/`
    - All filenames without `/` are treated as a file, not a folder. 
    - Filenames without an extension are treated as a "FILE" filetype. 
- A line that is just `#` 
    - All `#` are treated as comments by Sakura. So a filename with only a `#` will be treated as blank and throw a syntax error. 
    - If a name has a `#` sign in the middle of it, all text after the sign will be ignored as a comment 

### `...` errors
- `...` at the root level
    - Syntax error. Ellipses is only allowed at the subdirectory levels. 
- `...` can be placed anywhere within a subdirectory, as many times as necessary. These are visual representations of unknown or abstracted objects.

### Color map edge cases
- File with multiple dots, such as `archive.tar.gz`
    - Last extension wins.
- Files with no extension default to gray. 
- Extensions not in color map default to gray.

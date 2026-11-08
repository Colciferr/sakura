import { tokenize } from '../tokenizer';
import { equal, section, summary } from './harness';

// Compact signature of the meaningful tokens: "TYPE:depth:name"
const sig = (input: string) =>
  tokenize(input)
    .filter(t => t.type !== 'BLANK')
    .map(t => `${t.type}:${t.depth}:${t.name}`);

section('tokenizer');

equal('directory / file types and depth',
  sig('home/\n    documents/\n        notes.txt'),
  ['DIRECTORY:0:home', 'DIRECTORY:1:documents', 'FILE:2:notes.txt']);

equal('trailing slash stripped from the stored directory name',
  tokenize('home/')[0]!.name, 'home');

equal('inconsistent indent widths resolve by relative depth',
  sig('a/\n  b/\n      c'),
  ['DIRECTORY:0:a', 'DIRECTORY:1:b', 'FILE:2:c']);

equal('tabs and spaces both count as indentation',
  sig('a/\n\tb/\n\t\tc'),
  ['DIRECTORY:0:a', 'DIRECTORY:1:b', 'FILE:2:c']);

equal('separator and ellipsis are recognized',
  sig('a/\n    ...\n---\nb/'),
  ['DIRECTORY:0:a', 'ELLIPSIS:1:...', 'SEPARATOR:0:---', 'DIRECTORY:0:b']);

// There is no comment syntax: # and -- are ordinary characters, so a line
// containing them is an ordinary entry with the full text as its name.
equal('a line starting with # is an ordinary entry',
  sig('a/\n    # note'), ['DIRECTORY:0:a', 'FILE:1:# note']);
equal('a line starting with -- is an ordinary entry',
  sig('a/\n    -- note'), ['DIRECTORY:0:a', 'FILE:1:-- note']);
equal('inline # and -- stay part of the name',
  tokenize('notes.txt # keep -- this')[0]!.name, 'notes.txt # keep -- this');
equal('# with no space before it stays part of the name',
  tokenize('file#1.txt')[0]!.name, 'file#1.txt');

// Ellipsis is forgiving: the unicode … (iOS autocorrects "..." to it) and any
// run of 2+ dots all normalize to the '...' keyword.
equal('unicode … counts as an ellipsis',
  sig('a/\n    …'), ['DIRECTORY:0:a', 'ELLIPSIS:1:...']);
equal('2+ dots count as an ellipsis',
  sig('a/\n    ..\n    ....'), ['DIRECTORY:0:a', 'ELLIPSIS:1:...', 'ELLIPSIS:1:...']);

// A separator with trailing text (or extra dashes) is still a separator.
equal('separator with trailing text is recognized',
  sig('a/\n--- part two\nb/'),
  ['DIRECTORY:0:a', 'SEPARATOR:0:---', 'DIRECTORY:0:b']);

equal('separator with extra dashes is recognized',
  sig('a/\n----\nb/'),
  ['DIRECTORY:0:a', 'SEPARATOR:0:---', 'DIRECTORY:0:b']);

// The other Markdown horizontal rules separate trees too.
equal('*** is a separator',
  sig('a/\n***\nb/'), ['DIRECTORY:0:a', 'SEPARATOR:0:---', 'DIRECTORY:0:b']);
equal('___ is a separator',
  sig('a/\n___\nb/'), ['DIRECTORY:0:a', 'SEPARATOR:0:---', 'DIRECTORY:0:b']);

// Unicode whitespace counts as indentation. Text pasted from a web page or
// word processor often indents with non-breaking spaces (U+00A0).
equal('non-breaking spaces count as indentation',
  sig('a/\n    b/\n        c.txt'),
  ['DIRECTORY:0:a', 'DIRECTORY:1:b', 'FILE:2:c.txt']);
equal('ideographic spaces count as indentation',
  sig('a/\n　　b.txt'), ['DIRECTORY:0:a', 'FILE:1:b.txt']);

// Markdown bullet markers are dropped; indentation is measured before them.
equal('bullet markers are dropped from names',
  sig('- a/\n  - b/\n    - c.txt\n  * d\n  + e'),
  ['DIRECTORY:0:a', 'DIRECTORY:1:b', 'FILE:2:c.txt', 'FILE:1:d', 'FILE:1:e']);
equal('a lone dash is a name, not a bullet',
  sig('a/\n    -'), ['DIRECTORY:0:a', 'FILE:1:-']);
equal('a double dash is not a bullet',
  sig('a/\n    -- note'), ['DIRECTORY:0:a', 'FILE:1:-- note']);
equal('a bulleted ellipsis is still an ellipsis',
  sig('a/\n    - ...'), ['DIRECTORY:0:a', 'ELLIPSIS:1:...']);

// Pasted `tree` output: connector glyphs are read as indentation.
equal('tree connector glyphs resolve to depth',
  sig('repo\n├── src\n│   ├── a.ts\n│   └── b.ts\n└── docs\n    └── guide.md'),
  ['FILE:0:repo', 'FILE:1:src', 'FILE:2:a.ts', 'FILE:2:b.ts', 'FILE:1:docs', 'FILE:2:guide.md']);
equal('ASCII tree connectors resolve to depth',
  sig('repo\n|-- src\n|   `-- a.ts\n`-- docs'),
  ['FILE:0:repo', 'FILE:1:src', 'FILE:2:a.ts', 'FILE:1:docs']);
equal('the tree summary line is skipped',
  sig('repo\n└── a.ts\n\n1 directory, 1 file'),
  ['FILE:0:repo', 'FILE:1:a.ts']);
equal('a name that merely starts with | is left alone',
  sig('a/\n    |weird'), ['DIRECTORY:0:a', 'FILE:1:|weird']);

summary();

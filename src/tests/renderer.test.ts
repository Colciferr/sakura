import { tokenize } from '../tokenizer';
import { buildTrees } from '../treeBuilder';
import { renderTrees, RenderLine } from '../renderer';
import { equal, section, summary } from './harness';

const render = (input: string) => renderTrees(buildTrees(tokenize(input)));

// Flattens a line to plain text (dropping color) for structural assertions.
const text = (line: RenderLine) => line.map(s => s.text).join('');

section('renderer');

// --- connectors and structure ---
{
  const lines = render('home/\n    documents/\n        notes.txt\n    scripts/');
  equal('line count', lines.length, 4);
  equal('root line', text(lines[0]!), 'home/');
  equal('branch connector', text(lines[1]!), '├── documents/');
  equal('nested + last connector', text(lines[2]!), '│   └── notes.txt');
  equal('last root child', text(lines[3]!), '└── scripts/');
}

// --- separator produces a blank line between trees ---
{
  const lines = render('a/\n---\nb/');
  equal('separator yields a blank line between trees', lines.length, 3);
  equal('the blank line is an empty segment list', lines[1]!, []);
}

// --- colors ---
equal('root directory is colored gold', render('home/')[0]![0]!.color, 'gold');

{
  const lastSeg = (line: RenderLine) => line[line.length - 1]!;
  equal('a .json file is colored green',
    lastSeg(render('a/\n    x.json')[1]!).color, 'green');
  equal('an uppercase .PNG extension still colors (case-insensitive)',
    lastSeg(render('a/\n    pic.PNG')[1]!).color, 'red');
  equal('a tree connector segment carries no color',
    render('a/\n    x.json')[1]![0]!.color, null);
  equal('an unknown extension defaults to white',
    lastSeg(render('a/\n    x.xyz')[1]!).color, 'white');
  equal('a .conf file is colored green (merged config group)',
    lastSeg(render('a/\n    x.conf')[1]!).color, 'green');
}

// --- a root-level ellipsis renders like anything else (no errors anywhere) ---
equal('root-level ellipsis renders', text(render('...')[0]!), '...');

// --- no comment syntax: # and -- lines render as plain entries ---
equal('a # line renders as a plain entry',
  text(render('a/\n    # note')[1]!), '└── # note');
equal('a -- line renders as a plain entry',
  text(render('a/\n    -- note')[1]!), '└── -- note');

// --- trailing slash echoes the input ---
{
  equal('a typed slash is kept in the output',
    text(render('docs/\n    a/')[0]!), 'docs/');
  equal('an inferred folder renders without a slash',
    text(render('docs\n    a')[0]!), 'docs');
}

// --- pasted `tree` output round-trips: the rendered text matches the input ---
{
  const pasted = 'repo\n├── src\n│   ├── a.ts\n│   └── b.ts\n└── docs\n    └── guide.md';
  equal('pasted tree output renders back to the same text',
    render(pasted + '\n\n2 directories, 3 files').map(text).join('\n'), pasted);
}

// --- a bulleted outline renders as a tree ---
equal('a Markdown bulleted outline renders as a tree',
  render('- repo\n  - src\n    - a.ts\n  - docs').map(text),
  ['repo', '├── src', '│   └── a.ts', '└── docs']);

// --- non-breaking-space indentation nests instead of flattening ---
equal('non-breaking-space indentation nests',
  render('root\n    a.txt').map(text), ['root', '└── a.txt']);

// --- hidden folders and dotfiles ---
{
  const lastSeg = (line: RenderLine) => line[line.length - 1]!;
  equal('".github" is colored as a folder',
    lastSeg(render('repo\n    .github')[1]!).color, 'yellow');
  equal('".env" is colored green like a .env file',
    lastSeg(render('repo\n    .env')[1]!).color, 'green');
  equal('".gitignore" is colored white like a plain file',
    lastSeg(render('repo\n    .gitignore')[1]!).color, 'white');
}

summary();

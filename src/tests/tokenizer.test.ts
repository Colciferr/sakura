import { tokenize } from '../tokenizer';
import { check, equal, section, summary } from './harness';

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

equal('separator, ellipsis and comment are recognized',
  sig('a/\n    ...\n---\n# note\nb/'),
  ['DIRECTORY:0:a', 'ELLIPSIS:1:...', 'SEPARATOR:0:---', 'COMMENT:0:', 'DIRECTORY:0:b']);

check('a full-line -- comment becomes BLANK',
  tokenize('a/\n    -- hidden')[1]!.type === 'BLANK');

equal('an inline # comment is captured on the token',
  tokenize('home/  # root folder')[0]!.comment, 'root folder');

summary();

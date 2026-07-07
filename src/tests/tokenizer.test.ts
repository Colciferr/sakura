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

// Regression: a visible # comment followed by a hidden -- comment must not
// leave the "#" embedded in the name (the hidden part is stripped first,
// then the remainder is re-parsed for a visible comment).
{
  const token = tokenize('notes.txt # keep this -- drop this')[0]!;
  equal('# comment survives when a -- comment follows: name', token.name, 'notes.txt');
  equal('# comment survives when a -- comment follows: comment', token.comment, 'keep this');
}

// An inline # needs a space before it, matching the -- marker — so names
// containing # render as-is instead of being split.
{
  const token = tokenize('file#1.txt')[0]!;
  equal('# without a leading space stays part of the name', token.name, 'file#1.txt');
  equal('# without a leading space produces no comment', token.comment, undefined);
}

// Ellipsis is forgiving: the unicode … (iOS autocorrects "..." to it) and any
// run of 2+ dots all normalize to the '...' keyword.
equal('unicode … counts as an ellipsis',
  sig('a/\n    …'), ['DIRECTORY:0:a', 'ELLIPSIS:1:...']);
equal('2+ dots count as an ellipsis',
  sig('a/\n    ..\n    ....'), ['DIRECTORY:0:a', 'ELLIPSIS:1:...', 'ELLIPSIS:1:...']);

// A full-line # comment strips a trailing hidden -- part like every other
// line type — "never rendered" means never.
equal('full-line # comment drops its hidden -- tail',
  tokenize('# public note -- private remark')[0]!.comment, 'public note');

// Regression: a separator with trailing content (or extra dashes) is still a
// separator, not a silently-dropped hidden comment.
equal('separator with a trailing comment is recognized',
  sig('a/\n--- # note\nb/'),
  ['DIRECTORY:0:a', 'SEPARATOR:0:---', 'DIRECTORY:0:b']);

equal('separator with extra dashes is recognized',
  sig('a/\n----\nb/'),
  ['DIRECTORY:0:a', 'SEPARATOR:0:---', 'DIRECTORY:0:b']);

summary();

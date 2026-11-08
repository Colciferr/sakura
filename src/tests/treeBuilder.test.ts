import { tokenize } from '../tokenizer';
import { buildTrees } from '../treeBuilder';
import { check, equal, section, summary } from './harness';

const build = (input: string) => buildTrees(tokenize(input));

section('treeBuilder');

// --- basic structure ---
{
  const trees = build('home/\n    documents/\n        notes.txt\n    scripts/');
  equal('one tree produced', trees.length, 1);
  const home = trees[0]!.children[0]!;
  equal('root name', home.name, 'home');
  equal('root is a directory', home.type, 'directory');
  equal('root has two children', home.children.length, 2);
}

// --- slashes optional: a word with children is a directory ---
{
  const home = build('home\n    documents\n        notes.txt')[0]!.children[0]!;
  equal('word with children -> directory', home.type, 'directory');
  equal('nested word with children -> directory', home.children[0]!.type, 'directory');
  equal('leaf with an extension -> file', home.children[0]!.children[0]!.type, 'file');
}

// --- bare extensionless leaves: folder by default. A leaf is a file only
// when it's a classic build-file name (any case), or a well-known name typed
// in ALL CAPS — caps signal intent, the word list provides the vocabulary. ---
{
  const kids = build(
    'project\n    src\n    dist\n    README\n    LICENSE\n    TODO\n    todo\n    API\n    readme\n    dockerfile\n    Makefile\n    config.json'
  )[0]!.children[0]!.children;
  const typeOf = (n: string) => kids.find(k => k.name === n)!.type;
  equal('bare word "src" -> directory', typeOf('src'), 'directory');
  equal('bare word "dist" -> directory', typeOf('dist'), 'directory');
  equal('caps known word "README" -> file', typeOf('README'), 'file');
  equal('caps known word "LICENSE" -> file', typeOf('LICENSE'), 'file');
  equal('caps known word "TODO" -> file', typeOf('TODO'), 'file');
  equal('lowercase known word "todo" -> directory', typeOf('todo'), 'directory');
  equal('caps unknown word "API" -> directory', typeOf('API'), 'directory');
  equal('lowercase "readme" -> directory', typeOf('readme'), 'directory');
  equal('build file "dockerfile" (any case) -> file', typeOf('dockerfile'), 'file');
  equal('build file "Makefile" -> file', typeOf('Makefile'), 'file');
  equal('"config.json" -> file', typeOf('config.json'), 'file');
}

// --- extension parsing (case preserved on the node) ---
equal('file extension is parsed',
  build('a/\n    x.TXT')[0]!.children[0]!.children[0]!.extension, 'TXT');

// --- forgiving indentation ---
check('one tree built from messy / mixed indentation',
  build('a/\n  b/\n\t\tc.txt\n      d/').length === 1);

// --- separator ---
equal('separator splits input into two trees', build('a/\n---\nb/').length, 2);

// --- explicit vs inferred folders ---
equal('a typed slash is recorded on the node',
  build('home/')[0]!.children[0]!.explicitSlash, true);
equal('an inferred folder carries no explicit slash',
  build('home\n    x')[0]!.children[0]!.explicitSlash, false);

// --- leading-dot names: hidden folders by default, well-known dotfiles stay
// files. A dotfile with a further extension is an ordinary file. ---
{
  const kids = build(
    'repo\n    .git\n    .github\n    .vscode\n    .config\n    .gitignore\n    .env\n    .ENV\n    .env.local\n    .eslintrc.json'
  )[0]!.children[0]!.children;
  const node = (n: string) => kids.find(k => k.name === n)!;
  equal('".git" -> directory', node('.git').type, 'directory');
  equal('".github" -> directory', node('.github').type, 'directory');
  equal('".vscode" -> directory', node('.vscode').type, 'directory');
  equal('".config" -> directory', node('.config').type, 'directory');
  equal('".gitignore" -> file', node('.gitignore').type, 'file');
  equal('".env" -> file', node('.env').type, 'file');
  equal('".env" records "env" as its extension', node('.env').extension, 'env');
  equal('dotfile match is case-insensitive', node('.ENV').type, 'file');
  equal('".env.local" -> file with extension "local"',
    [node('.env.local').type, node('.env.local').extension], ['file', 'local']);
  equal('".eslintrc.json" -> file with extension "json"',
    [node('.eslintrc.json').type, node('.eslintrc.json').extension], ['file', 'json']);
}
equal('a dot-name with children is a directory',
  build('.github\n    workflows')[0]!.children[0]!.type, 'directory');
equal('"." (the root `tree` prints) is a directory',
  build('.\n    src')[0]!.children[0]!.type, 'directory');

summary();

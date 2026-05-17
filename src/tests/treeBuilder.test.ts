import { tokenize } from '../tokenizer';
import { buildTrees } from '../treeBuilder';
import { check, equal, section, summary } from './harness';

const build = (input: string) => buildTrees(tokenize(input));

section('treeBuilder');

// --- basic structure ---
{
  const { trees, errors } = build('home/\n    documents/\n        notes.txt\n    scripts/');
  equal('no build errors on a basic tree', errors, []);
  equal('one tree produced', trees.length, 1);
  const home = trees[0]!.children[0]!;
  equal('root name', home.name, 'home');
  equal('root is a directory', home.type, 'directory');
  equal('root has two children', home.children.length, 2);
}

// --- slashes optional: a word with children is a directory ---
{
  const home = build('home\n    documents\n        notes.txt').trees[0]!.children[0]!;
  equal('word with children -> directory', home.type, 'directory');
  equal('nested word with children -> directory', home.children[0]!.type, 'directory');
  equal('leaf with an extension -> file', home.children[0]!.children[0]!.type, 'file');
}

// --- bare extensionless leaves: folder by default, known files stay files ---
{
  const kids = build('project\n    src\n    dist\n    README\n    LICENSE\n    config.json')
    .trees[0]!.children[0]!.children;
  const typeOf = (n: string) => kids.find(k => k.name === n)!.type;
  equal('bare word "src" -> directory', typeOf('src'), 'directory');
  equal('bare word "dist" -> directory', typeOf('dist'), 'directory');
  equal('known file "README" -> file', typeOf('README'), 'file');
  equal('known file "LICENSE" -> file', typeOf('LICENSE'), 'file');
  equal('"config.json" -> file', typeOf('config.json'), 'file');
}

// --- extension parsing (case preserved on the node) ---
equal('file extension is parsed',
  build('a/\n    x.TXT').trees[0]!.children[0]!.children[0]!.extension, 'TXT');

// --- forgiving indentation ---
{
  const { trees, errors } = build('a/\n  b/\n\t\tc.txt\n      d/');
  equal('messy / mixed indentation produces no errors', errors, []);
  check('one tree built from messy input', trees.length === 1);
}

// --- separator ---
equal('separator splits input into two trees', build('a/\n---\nb/').trees.length, 2);

// --- explicit vs inferred folders ---
equal('a typed slash is recorded on the node',
  build('home/').trees[0]!.children[0]!.explicitSlash, true);
equal('an inferred folder carries no explicit slash',
  build('home\n    x').trees[0]!.children[0]!.explicitSlash, false);

summary();

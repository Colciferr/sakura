import { tokenize } from '../tokenizer';
import { buildTrees } from '../treeBuilder';
import { validateTrees } from '../validator';
import { check, equal, section, summary } from './harness';

const validate = (input: string) => validateTrees(buildTrees(tokenize(input)).trees);

section('validator');

equal('multiple roots produce no error',
  validate('home/\n    a/\nshared/\n    b/'), []);

equal('odd filename characters produce no error',
  validate('home/\n    a<b>/\n        c:d.txt'), []);

const rootEllipsis = validate('home/\n    documents/\n...');
equal('ellipsis at the root level produces one error', rootEllipsis.length, 1);
check('the error message mentions the ellipsis',
  rootEllipsis[0]!.message.toLowerCase().includes('ellipsis'));

equal('an ellipsis below the root is fine',
  validate('home/\n    ...'), []);

summary();

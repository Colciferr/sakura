import { tokenize } from '../tokenizer';
import { buildTrees } from '../treeBuilder';
import { validateTrees } from '../validator';

// Test 1: multiple roots without target
const input1 = `home/
    documents/
shared/
    games/`;

const result1 = validateTrees(buildTrees(tokenize(input1)).trees);
console.log('Test 1 - multiple roots without target:');
console.log(JSON.stringify(result1, null, 2));

// Test 2: multiple roots with target (should pass)
const input2 = `target: 'C:/temp'
home/
shared/`;

const result2 = validateTrees(buildTrees(tokenize(input2)).trees);
console.log('\nTest 2 - multiple roots with target (no errors expected):');
console.log(JSON.stringify(result2, null, 2));

// Test 3: ellipsis at root level
const input3 = `home/
    documents/
...`;

const result3 = validateTrees(buildTrees(tokenize(input3)).trees);
console.log('\nTest 3 - ellipsis at root level:');
console.log(JSON.stringify(result3, null, 2));

// Test 4: invalid Windows filename
const input4 = `home/
    docu<ments/
        no:name.txt`;

const result4 = validateTrees(buildTrees(tokenize(input4)).trees);
console.log('\nTest 4 - invalid filename characters:');
console.log(JSON.stringify(result4, null, 2));
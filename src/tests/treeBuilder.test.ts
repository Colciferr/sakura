import { tokenize } from '../tokenizer';
import { buildTrees } from '../treeBuilder';

// Test 1: basic tree
const input1 = `home/
    documents/
        notes.txt
    scripts/
        program.exe`;

const result1 = buildTrees(tokenize(input1));
console.log('Test 1 - basic tree:');
console.log(JSON.stringify(result1, null, 2));

// Test 2: target + separator
const input2 = `target: 'C:/temp'
root/
    subdir/
---
target: 'C:/other'
shared/
    games/`;

const result2 = buildTrees(tokenize(input2));
console.log('\nTest 2 - target + separator:');
console.log(JSON.stringify(result2, null, 2));

// Test 3: ellipsis
const input3 = `scripts/
    powershell/
        hello.ps1
        ...`;

const result3 = buildTrees(tokenize(input3));
console.log('\nTest 3 - ellipsis:');
console.log(JSON.stringify(result3, null, 2));

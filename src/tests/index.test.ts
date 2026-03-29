import { sakura } from '../index';

// Test 1: valid tree
const input1 = `home/
    documents/
        notes.txt
    scripts/
        deploy.ps1`;

console.log('Test 1 - valid tree:');
console.log(sakura(input1));

// Test 2: validation error
const input2 = `home/
    documents/
shared/`;

console.log('\nTest 2 - validation error:');
console.log(sakura(input2));

// Test 3: builder error
const input3 = `home/
    documents/
target: 'C:/temp'`;

console.log('\nTest 3 - builder error:');
console.log(sakura(input3));
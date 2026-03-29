import { tokenize } from '../tokenizer';
import { buildTrees } from '../treeBuilder';
import { renderTrees } from '../renderer';

const input = `target: 'C:/temp'
home/
    documents/
        notes.txt
        readme.md
        config.json
    scripts/
        program.exe
        deploy.ps1
        ...`;

const trees = buildTrees(tokenize(input)).trees;

console.log('ANSI output:');
console.log(renderTrees(trees, 'ansi'));

console.log('\nHTML output:');
console.log(renderTrees(trees, 'html'));

const input2 = `target: 'C:\\'
home/
    documents/
        notes.txt
---
target: 'C:\\temp'
shared/
    games/
        runescape.exe
    pictures/`;

console.log('\nANSI multi-tree output:');
console.log(renderTrees(buildTrees(tokenize(input2)).trees, 'ansi'));
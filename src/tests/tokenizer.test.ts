import { tokenize } from '../tokenizer';

const input = `target: 'C:\\temp'
home/
    documents/          # inline comment
    ...
---
# full line comment
scripts/`;

const tokens = tokenize(input);

for(const token of tokens) {
    console.log(`[${token.type}] depth:${token.depth} name:"${token.name}"`);
}
#!/usr/bin/env mode
import * as fs from 'fs';
import * as readline from 'readline';
import { sakura } from './index';

const filePath = process.argv[2];

if (filePath) {
  // file mode
  const fileContent = fs.readFileSync(filePath!, 'utf-8');
  console.log(sakura(fileContent, 'ansi'));
} 
else {
  // REPL mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const lines: string[] = [];

  console.log('Sakura REPL — type your tree, then :render to output, :clear to reset, :quit to exit.\n');

  rl.on('line', (input) => {
    if (input === ':quit') {
      rl.close();
    } 
    else if (input === ':render') {
      console.log('\n' + sakura(lines.join('\n'), 'ansi') + '\n');
    } 
    else if (input === ':clear') {
      lines.length = 0;
      console.log('cleared.\n');
    } 
    else {
      lines.push(input);
    }
  });
}
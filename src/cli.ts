import * as fs from 'fs';
import { sakura } from './index';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: ts-node src/cli.ts <path-to-file>');
  process.exit(1);
}

const fileContent = fs.readFileSync(filePath!, 'utf-8');
console.log(sakura(fileContent, 'ansi'));
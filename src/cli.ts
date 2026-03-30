#!/usr/bin/env node
import * as fs from 'fs';
import { sakura } from './index';
import { Editor } from './editor';

const filePath = process.argv[2];

if (filePath) {
  // File mode: read and render a .sakura file directly
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    console.log(sakura(fileContent, 'ansi'));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: could not read file "${filePath}" — ${message}`);
    process.exit(1);
  }
}
else {
  // Interactive editor mode
  const editor = new Editor((input: string) => sakura(input, 'ansi'));
  editor.start();
}
// Token types. Every line in a Sakura block is one of these
export type TokenType =
  | 'TARGET'
  | 'DIRECTORY'
  | 'FILE'
  | 'SEPARATOR'
  | 'ELLIPSIS'
  | 'COMMENT'
  | 'BLANK'

// The shape of a single token 
export interface Token {
    type: TokenType;
    raw: string;        // original line, untouched
    depth: number;       // indent level (0 = root)
    name: string;    // cleaned name, no indent or trailing comment 
}

// Detects the indent unit from the first indented line (tabs or spaces)
function detectIndentUnit(lines: string[]): string | null {
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) return match[1] ?? null; // return the first indent we see
  }
  return null; // no indentation found
}

// Strips trailing inline comment from a name, trims whitespace
function stripComment(text: string): string {
  const commentIndex = text.indexOf('#');
  if (commentIndex === -1) return text.trim();
  return text.slice(0, commentIndex).trim();
}

// Main tokenizer function
export function tokenize(input: string): Token[] {
  const lines = input.split('\n').map(line => line.replace(/\r$/, '')); // normalize line endings
  const indentUnit = detectIndentUnit(lines);
  const tokens: Token[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();

    // BLANK
    if (trimmed === '') {
      tokens.push({ type: 'BLANK', raw, depth: 0, name: '' });
      continue;
    }

    // COMMENT - whole line is a comment
    if (trimmed.startsWith('#')) {
      tokens.push({ type: 'COMMENT', raw, depth: 0, name: trimmed });
      continue;
    }

    // SEPARATOR
    if (trimmed === '---') {
      tokens.push({ type: 'SEPARATOR', raw, depth: 0, name: '---' });
      continue;
    }

    // Calculate depth from indentation
    let depth = 0;
    if (indentUnit) {
      let remaining = raw;
      while (remaining.startsWith(indentUnit)) {
        depth++;
        remaining = remaining.slice(indentUnit.length);
      }
    }

    const name = stripComment(trimmed);

    // TARGET
    if (name.startsWith('target:')) {
      tokens.push({ type: 'TARGET', raw, depth: 0, name });
      continue;
    }

    // ELLIPSIS
    if (name === '...') {
      tokens.push({ type: 'ELLIPSIS', raw, depth, name: '...' });
      continue;
    }

    // DIRECTORY
    if (name.endsWith('/')) {
      tokens.push({ type: 'DIRECTORY', raw, depth, name });
      continue;
    }

    // FILE (anything else with a name)
    tokens.push({ type: 'FILE', raw, depth, name });
  }

  return tokens;
}
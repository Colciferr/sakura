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
    comment?: string | undefined;  // visible inline comment text (from #)
    line: number;
}

// Detects the indent unit from the first indented line (tabs or spaces)
function detectIndentUnit(lines: string[]): string | null {
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) return match[1] ?? null; // return the first indent we see
  }
  return null; // no indentation found
}

// Strips trailing inline comments from a name.
// # comments are visible (preserved as comment text), -- comments are hidden (discarded).
function stripComment(text: string): { name: string; comment?: string | undefined } {
  // Hidden comment: ` --` (require space before -- to avoid matching filenames like my--file.txt)
  const hiddenIdx = text.indexOf(' --');
  if (hiddenIdx !== -1) {
    return { name: text.slice(0, hiddenIdx).trim() };
  }
  // Visible comment: # (strip from name, preserve text)
  const commentIdx = text.indexOf('#');
  if (commentIdx !== -1) {
    const comment = text.slice(commentIdx + 1).trim();
    return {
      name: text.slice(0, commentIdx).trim(),
      comment: comment || undefined,
    };
  }
  return { name: text.trim() };
}

// Main tokenizer function
export function tokenize(input: string): Token[] {
  const lines = input.split('\n').map(line => line.replace(/\r$/, '')); // normalize line endings
  const indentUnit = detectIndentUnit(lines);
  const tokens: Token[] = [];

  for (let i = 0; i < lines.length; i++) {
      const raw = lines[i]!;
      const trimmed = raw.trim();

    // BLANK
    if (trimmed === '') {
      tokens.push({ type: 'BLANK', raw, depth: 0, name: '', line: i + 1  });
      continue;
    }

    // HIDDEN COMMENT - full line starting with -- (not rendered)
    if (trimmed.startsWith('--') && trimmed !== '---') {
      tokens.push({ type: 'BLANK', raw, depth: 0, name: '', line: i + 1 });
      continue;
    }

    // VISIBLE COMMENT - full line starting with # (rendered in output)
    if (trimmed.startsWith('#')) {
      // Calculate depth so comment can be placed at correct tree level
      let commentDepth = 0;
      if (indentUnit) {
        let remaining = raw;
        while (remaining.startsWith(indentUnit)) {
          commentDepth++;
          remaining = remaining.slice(indentUnit.length);
        }
      }
      const commentText = trimmed.slice(1).trim();
      tokens.push({ type: 'COMMENT', raw, depth: commentDepth, name: '', comment: commentText || undefined, line: i + 1 });
      continue;
    }

    // SEPARATOR
    if (trimmed === '---') {
      tokens.push({ type: 'SEPARATOR', raw, depth: 0, name: '---', line: i + 1  });
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

    const { name, comment } = stripComment(trimmed);

    // TARGET
    if (name.startsWith('target:')) {
      tokens.push({ type: 'TARGET', raw, depth: 0, name, line: i + 1  });
      continue;
    }

    // ELLIPSIS
    if (name === '...') {
      tokens.push({ type: 'ELLIPSIS', raw, depth, name: '...', comment, line: i + 1  });
      continue;
    }

    // DIRECTORY
    if (name.endsWith('/')) {
      tokens.push({ type: 'DIRECTORY', raw, depth, name, comment, line: i + 1  });
      continue;
    }

    // FILE (anything else with a name)
    tokens.push({ type: 'FILE', raw, depth, name, comment, line: i + 1  });
  }

  return tokens;
}
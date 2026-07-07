// Token types. Every line in a Sakura block is one of these
export type TokenType =
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

// Measures the visual width of a line's leading whitespace.
// Tabs advance to the next 4-column tab stop; spaces count as 1.
// Measuring width (rather than counting a fixed indent unit) is what lets
// inconsistent indent widths and mixed tabs/spaces resolve sensibly.
function indentWidth(line: string): number {
  let width = 0;
  for (const ch of line) {
    if (ch === '\t') width += 4 - (width % 4);
    else if (ch === ' ') width += 1;
    else break;
  }
  return width;
}

// Strips trailing inline comments from a name.
// # comments are visible (preserved as comment text), -- comments are hidden (discarded).
// Both markers require a leading space, so names like my--file.txt or file#1.txt
// pass through untouched.
function stripComment(text: string): { name: string; comment?: string | undefined } {
  // Hidden comment: drop the tail, then re-parse what's left — a visible
  // # comment before the hidden marker must still be picked up.
  const hiddenIdx = text.indexOf(' --');
  if (hiddenIdx !== -1) {
    return stripComment(text.slice(0, hiddenIdx));
  }
  // Visible comment: strip from name, preserve text
  const commentIdx = text.indexOf(' #');
  if (commentIdx !== -1) {
    const comment = text.slice(commentIdx + 2).trim();
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
  const tokens: Token[] = [];

  // Relative-indentation stack. Holds the leading-whitespace width of every
  // currently-open level; a line's depth is its position in this stack.
  // Because depth is relative, the exact indent width never has to be
  // consistent — only "deeper" vs "shallower" matters.
  let indentStack: number[] = [];

  function resolveDepth(width: number): number {
    if (indentStack.length === 0) {
      indentStack.push(width); // first content line establishes the base level
      return 0;
    }
    // Drop any open levels deeper than this line (always keep the base level).
    while (indentStack.length > 1 && indentStack[indentStack.length - 1]! > width) {
      indentStack.pop();
    }
    // Deeper than the current level opens exactly one new level — a big jump
    // in indentation still only counts as a single step down the tree.
    if (width > indentStack[indentStack.length - 1]!) {
      indentStack.push(width);
    }
    return indentStack.length - 1;
  }

  for (let i = 0; i < lines.length; i++) {
      const raw = lines[i]!;
      const trimmed = raw.trim();

    // BLANK
    if (trimmed === '') {
      tokens.push({ type: 'BLANK', raw, depth: 0, name: '', line: i + 1  });
      continue;
    }

    // SEPARATOR - ends the current tree; reset indentation for the next one.
    // Checked before the hidden-comment rule so "--- # note" or "----" still
    // separate trees instead of vanishing: three or more dashes, alone or
    // followed by whitespace (any trailing text is ignored like a comment).
    if (/^-{3,}(\s|$)/.test(trimmed)) {
      tokens.push({ type: 'SEPARATOR', raw, depth: 0, name: '---', line: i + 1  });
      indentStack = [];
      continue;
    }

    // HIDDEN COMMENT - full line starting with -- (not rendered)
    if (trimmed.startsWith('--')) {
      tokens.push({ type: 'BLANK', raw, depth: 0, name: '', line: i + 1 });
      continue;
    }

    // Every remaining line type carries a depth derived from its indentation
    const depth = resolveDepth(indentWidth(raw));

    // VISIBLE COMMENT - full line starting with # (rendered in output).
    // A trailing ` --` hidden part is dropped here too — "never rendered"
    // holds on comment lines just like everywhere else.
    if (trimmed.startsWith('#')) {
      let commentText = trimmed.slice(1);
      const hiddenIdx = commentText.indexOf(' --');
      if (hiddenIdx !== -1) commentText = commentText.slice(0, hiddenIdx);
      commentText = commentText.trim();
      tokens.push({ type: 'COMMENT', raw, depth, name: '', comment: commentText || undefined, line: i + 1 });
      continue;
    }

    const { name, comment } = stripComment(trimmed);

    // ELLIPSIS - the keyword is '...', but 2+ dots and the unicode … (what
    // iOS autocorrects "..." into) are accepted and normalized to it.
    if (/^(\.{2,}|…)$/.test(name)) {
      tokens.push({ type: 'ELLIPSIS', raw, depth, name: '...', comment, line: i + 1  });
      continue;
    }

    // DIRECTORY - a trailing slash explicitly marks a folder. The slash is
    // stripped from the stored name; the renderer re-adds it so output looks
    // the same whether or not the slash was typed.
    if (name.endsWith('/')) {
      tokens.push({ type: 'DIRECTORY', raw, depth, name: name.replace(/\/+$/, ''), comment, line: i + 1  });
      continue;
    }

    // FILE - anything else. May still be promoted to a directory by the
    // tree builder if it turns out to have children nested under it.
    tokens.push({ type: 'FILE', raw, depth, name, comment, line: i + 1  });
  }

  return tokens;
}

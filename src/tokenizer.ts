// Token types. Every line in a Sakura block is one of these
export type TokenType =
  | 'DIRECTORY'
  | 'FILE'
  | 'SEPARATOR'
  | 'ELLIPSIS'
  | 'BLANK'

// The shape of a single token
export interface Token {
    type: TokenType;
    raw: string;        // original line, untouched
    depth: number;       // indent level (0 = root)
    name: string;    // cleaned name, no indent
    line: number;
}

// Measures the visual width of a line's leading whitespace.
// Tabs advance to the next 4-column tab stop; every other whitespace
// character counts as 1 — that includes the non-breaking space (U+00A0) and
// the ideographic space (U+3000), which show up when text is pasted from a
// web page, a word processor, or a chat app. Without this, such lines would
// look indented but measure as width 0 and all collapse to the root level.
// Measuring width (rather than counting a fixed indent unit) is what lets
// inconsistent indent widths and mixed tabs/spaces resolve sensibly.
function indentWidth(line: string): number {
  let width = 0;
  for (const ch of line) {
    if (ch === '\t') width += 4 - (width % 4);
    else if (/\s/.test(ch)) width += 1;
    else break;
  }
  return width;
}

// Pasted output of the `tree` command (or any hand-drawn ASCII tree) carries
// its structure in connector glyphs rather than indentation:
//     repo
//     ├── src
//     │   └── a.ts
//     └── docs
// Each 4-character group before the connector (`│   `, `|   `, or four
// spaces) is one nesting level, and the connector itself (`├── `, `└── `, or
// the ASCII forms `|-- `, `` `-- ``, `+-- `, `\-- `) is one more. Replacing the
// whole prefix with the same number of spaces turns it into ordinary
// indentation, so the relative-depth logic below needs no special case.
const TREE_PREFIX = /^((?:[│|]\s{3}|\s{4})*)([├└]─{2}|[|`+\\]-{2})(\s|$)/;

function normalizeTreeGlyphs(line: string): string {
  const match = TREE_PREFIX.exec(line);
  if (!match) return line;
  const prefix = match[0];
  return ' '.repeat(prefix.length) + line.slice(prefix.length);
}

// The summary line `tree` prints last ("3 directories, 2 files"). It is not
// an entry, so it is skipped like a blank line when a whole tree is pasted.
const TREE_SUMMARY = /^\d+ director(y|ies)(, \d+ files?)?$/;

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
      // Tree connector glyphs become indentation before anything else looks
      // at the line, so a pasted `tree` is read exactly like a typed one.
      const normalized = normalizeTreeGlyphs(raw);
      const trimmed = normalized.trim();

    // BLANK — also the `tree` summary line, which carries no entry.
    if (trimmed === '' || TREE_SUMMARY.test(trimmed)) {
      tokens.push({ type: 'BLANK', raw, depth: 0, name: '', line: i + 1  });
      continue;
    }

    // SEPARATOR - ends the current tree; reset indentation for the next one.
    // Three or more dashes, alone or followed by whitespace — any trailing
    // text is ignored, so "----" or "--- part two" still separate trees.
    // The other two Markdown horizontal rules, *** and ___, work the same way.
    if (/^(-{3,}|\*{3,}|_{3,})(\s|$)/.test(trimmed)) {
      tokens.push({ type: 'SEPARATOR', raw, depth: 0, name: '---', line: i + 1  });
      indentStack = [];
      continue;
    }

    // Every remaining line type carries a depth derived from its indentation
    const depth = resolveDepth(indentWidth(normalized));

    // A Markdown bullet marker (`- `, `* `, `+ `) is dropped so an existing
    // bulleted outline becomes a tree just by changing the fence language.
    // The indentation was measured above, before the marker, so nesting is
    // unaffected. A bare `-` or `*` with nothing after it is kept as a name.
    const name = trimmed.replace(/^[-*+]\s+/, '');

    // ELLIPSIS - the keyword is '...', but 2+ dots and the unicode … (what
    // iOS autocorrects "..." into) are accepted and normalized to it.
    if (/^(\.{2,}|…)$/.test(name)) {
      tokens.push({ type: 'ELLIPSIS', raw, depth, name: '...', line: i + 1  });
      continue;
    }

    // DIRECTORY - a trailing slash explicitly marks a folder. The slash is
    // stripped from the stored name; the renderer re-adds it so output looks
    // the same whether or not the slash was typed.
    if (name.endsWith('/')) {
      tokens.push({ type: 'DIRECTORY', raw, depth, name: name.replace(/\/+$/, ''), line: i + 1  });
      continue;
    }

    // FILE - anything else. May still be promoted to a directory by the
    // tree builder if it turns out to have children nested under it.
    tokens.push({ type: 'FILE', raw, depth, name, line: i + 1  });
  }

  return tokens;
}

// Interactive terminal editor for Sakura REPL mode.
// Uses raw stdin mode + ANSI escape sequences — no external dependencies.
// Keybindings: Ctrl+R = render, Ctrl+L = clear, Ctrl+Q = quit

const TAB_SIZE = 4;

// Header lines shown at top of editor
const HEADER = [
  '\x1b[1;35mSakura Editor\x1b[0m',
  '\x1b[90mCtrl+R: render  |  Ctrl+L: clear  |  Ctrl+Q: quit  |  Tab: indent\x1b[0m',
  '', // blank separator
];
const HEADER_HEIGHT = HEADER.length;
const FOOTER_HEIGHT = 1; // status bar

export class Editor {
  private lines: string[] = [''];
  private cursorRow = 0;
  private cursorCol = 0;
  private scrollOffset = 0;
  private rows = 24;
  private cols = 80;
  private waitingForKey = false; // true when showing render output

  constructor(private renderFn: (input: string) => string) {}

  start(): void {
    // Grab terminal dimensions
    this.rows = process.stdout.rows || 24;
    this.cols = process.stdout.columns || 80;

    // Enter alternate screen buffer and enable raw mode
    process.stdout.write('\x1b[?1049h'); // alternate screen
    process.stdout.write('\x1b[?25h');   // ensure cursor visible
    process.stdin.setRawMode(true);
    process.stdin.resume();

    // Listen for resize events
    process.stdout.on('resize', () => {
      this.rows = process.stdout.rows || 24;
      this.cols = process.stdout.columns || 80;
      this.adjustScroll();
      this.paint();
    });

    // Handle each keypress as raw bytes
    process.stdin.on('data', (buf: Buffer) => this.handleKey(buf));

    // Safety cleanup on unexpected exit
    process.on('exit', () => this.cleanup());

    this.paint();
  }

  // Restore terminal to normal state
  private cleanup(): void {
    process.stdout.write('\x1b[?25h');   // show cursor
    process.stdout.write('\x1b[?1049l'); // leave alternate screen
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  }

  // Dispatch raw key buffer to the appropriate action
  private handleKey(buf: Buffer): void {
    // If we're showing render output, any key returns to editor
    if (this.waitingForKey) {
      this.waitingForKey = false;
      this.paint();
      return;
    }

    if (buf.length === 0) return;
    const seq = buf.toString('utf8');
    const byte0 = buf[0]!;

    // --- Escape sequences (arrows, home, end, delete) ---
    if (byte0 === 0x1b && buf.length >= 3 && buf[1] === 0x5b) {
      const code = buf[2];
      if (code === 65) { this.moveCursor('up'); return; }    // Up
      if (code === 66) { this.moveCursor('down'); return; }  // Down
      if (code === 67) { this.moveCursor('right'); return; } // Right
      if (code === 68) { this.moveCursor('left'); return; }  // Left
      if (code === 72) { this.cursorCol = 0; this.paint(); return; } // Home
      if (code === 70) { this.cursorCol = this.currentLine().length; this.paint(); return; } // End
      // Delete key: \x1b[3~
      if (code === 51 && buf.length >= 4 && buf[3] === 0x7e) {
        this.deleteForward();
        return;
      }
      return; // ignore other escape sequences
    }

    // --- Ctrl keys ---
    if (byte0 === 0x11) { this.doQuit(); return; }   // Ctrl+Q
    if (byte0 === 0x12) { this.doRender(); return; }  // Ctrl+R
    if (byte0 === 0x0c) { this.doClear(); return; }   // Ctrl+L

    // Ctrl+C — also quit for safety
    if (byte0 === 0x03) { this.doQuit(); return; }

    // --- Enter ---
    if (byte0 === 0x0d) { this.newLine(); return; }

    // --- Backspace (0x7f on most terminals, 0x08 on some Windows terminals) ---
    if (byte0 === 0x7f || byte0 === 0x08) { this.backspace(); return; }

    // --- Tab ---
    if (byte0 === 0x09) {
      const spaces = ' '.repeat(TAB_SIZE);
      this.insertText(spaces);
      return;
    }

    // --- Printable characters ---
    // Accept any UTF-8 string that doesn't start with a control byte
    if (byte0 >= 32) {
      this.insertText(seq);
      return;
    }
  }

  // --- Cursor movement ---

  private moveCursor(dir: 'up' | 'down' | 'left' | 'right'): void {
    switch (dir) {
      case 'up':
        if (this.cursorRow > 0) {
          this.cursorRow--;
          // Clamp column to new line length
          this.cursorCol = Math.min(this.cursorCol, this.currentLine().length);
        }
        break;
      case 'down':
        if (this.cursorRow < this.lines.length - 1) {
          this.cursorRow++;
          this.cursorCol = Math.min(this.cursorCol, this.currentLine().length);
        }
        break;
      case 'left':
        if (this.cursorCol > 0) {
          this.cursorCol--;
        } else if (this.cursorRow > 0) {
          // Wrap to end of previous line
          this.cursorRow--;
          this.cursorCol = this.currentLine().length;
        }
        break;
      case 'right':
        if (this.cursorCol < this.currentLine().length) {
          this.cursorCol++;
        } else if (this.cursorRow < this.lines.length - 1) {
          // Wrap to start of next line
          this.cursorRow++;
          this.cursorCol = 0;
        }
        break;
    }
    this.adjustScroll();
    this.paint();
  }

  // --- Text editing ---

  private insertText(text: string): void {
    const line = this.currentLine();
    this.lines[this.cursorRow] = line.slice(0, this.cursorCol) + text + line.slice(this.cursorCol);
    this.cursorCol += text.length;
    this.paint();
  }

  private newLine(): void {
    const line = this.currentLine();
    const before = line.slice(0, this.cursorCol);
    const after = line.slice(this.cursorCol);
    this.lines[this.cursorRow] = before;
    this.lines.splice(this.cursorRow + 1, 0, after);
    this.cursorRow++;
    this.cursorCol = 0;
    this.adjustScroll();
    this.paint();
  }

  private backspace(): void {
    if (this.cursorCol > 0) {
      // Delete character before cursor on this line
      const line = this.currentLine();
      this.lines[this.cursorRow] = line.slice(0, this.cursorCol - 1) + line.slice(this.cursorCol);
      this.cursorCol--;
    } else if (this.cursorRow > 0) {
      // Join current line with previous line
      const currentContent = this.lines[this.cursorRow] ?? '';
      this.lines.splice(this.cursorRow, 1);
      this.cursorRow--;
      this.cursorCol = this.currentLine().length;
      this.lines[this.cursorRow] = this.currentLine() + currentContent;
    }
    this.adjustScroll();
    this.paint();
  }

  private deleteForward(): void {
    const line = this.currentLine();
    if (this.cursorCol < line.length) {
      // Delete character at cursor
      this.lines[this.cursorRow] = line.slice(0, this.cursorCol) + line.slice(this.cursorCol + 1);
    } else if (this.cursorRow < this.lines.length - 1) {
      // Join next line onto this one
      this.lines[this.cursorRow] = this.currentLine() + (this.lines[this.cursorRow + 1] ?? '');
      this.lines.splice(this.cursorRow + 1, 1);
    }
    this.paint();
  }

  // --- Commands ---

  private doRender(): void {
    const input = this.lines.join('\n');
    const output = this.renderFn(input);

    // Clear screen and show rendered output
    let buf = '\x1b[?25l'; // hide cursor
    buf += '\x1b[2J\x1b[H'; // clear screen, go to top-left
    buf += '\x1b[1;35m--- Rendered Output ---\x1b[0m\n\n';
    buf += output;
    buf += '\n\n\x1b[90m--- Press any key to return to editor ---\x1b[0m';
    buf += '\x1b[?25h'; // show cursor
    process.stdout.write(buf);

    this.waitingForKey = true;
  }

  private doClear(): void {
    this.lines = [''];
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.scrollOffset = 0;
    this.paint();
  }

  private doQuit(): void {
    this.cleanup();
    process.exit(0);
  }

  // --- Screen painting ---

  private paint(): void {
    const visibleRows = this.rows - HEADER_HEIGHT - FOOTER_HEIGHT;
    let buf = '';

    buf += '\x1b[?25l';  // hide cursor (prevents flicker)
    buf += '\x1b[H';     // move to top-left

    // Draw header
    for (const headerLine of HEADER) {
      buf += headerLine + '\x1b[K\n'; // \x1b[K clears rest of line
    }

    // Draw visible lines from the buffer
    for (let i = 0; i < visibleRows; i++) {
      const lineIdx = this.scrollOffset + i;
      if (lineIdx < this.lines.length) {
        const fullLine = this.lines[lineIdx] ?? '';
        if (fullLine.length > this.cols) {
          // Truncate and show overflow indicator
          buf += fullLine.slice(0, this.cols - 1) + '\x1b[90m>\x1b[0m';
        } else {
          buf += fullLine;
        }
      }
      buf += '\x1b[K\n'; // clear rest of line + newline
    }

    // Draw status bar at bottom
    const status = ` Ln ${this.cursorRow + 1}, Col ${this.cursorCol + 1} | ${this.lines.length} lines `;
    buf += '\x1b[7m'; // inverse video for status bar
    buf += status.padEnd(this.cols);
    buf += '\x1b[0m'; // reset

    // Position cursor at the correct location in the editor
    const screenRow = HEADER_HEIGHT + (this.cursorRow - this.scrollOffset) + 1; // +1 because ANSI rows are 1-based
    const screenCol = this.cursorCol + 1; // ANSI cols are 1-based
    buf += `\x1b[${screenRow};${screenCol}H`;

    buf += '\x1b[?25h'; // show cursor
    process.stdout.write(buf);
  }

  // Keep cursor within the visible area by adjusting scroll offset
  private adjustScroll(): void {
    const visibleRows = this.rows - HEADER_HEIGHT - FOOTER_HEIGHT;
    if (this.cursorRow < this.scrollOffset) {
      this.scrollOffset = this.cursorRow;
    } else if (this.cursorRow >= this.scrollOffset + visibleRows) {
      this.scrollOffset = this.cursorRow - visibleRows + 1;
    }
  }

  // Helper: get the current line text
  private currentLine(): string {
    return this.lines[this.cursorRow] ?? '';
  }
}

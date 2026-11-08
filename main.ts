import { Plugin } from "obsidian";
import { tokenize } from "./src/tokenizer";
import { buildTrees } from "./src/treeBuilder";
import { renderTrees } from "./src/renderer";

export default class SakuraPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("sakura", (source, el) => {
      // Style the Obsidian-provided wrapper to match our dark panel
      el.addClass("sakura-wrapper");

      const container = el.createDiv({ cls: "sakura-container" });

      // Sakura has no syntax errors — every input renders. The try/catch is
      // the safety net for the unexpected: a failure surfaces a friendly
      // message, never a blank block or a thrown exception.
      try {
        const trees = buildTrees(tokenize(source));

        if (trees.length > 0) {
          // Build the tree as DOM nodes — one <span> per colored segment,
          // plain text for connectors and line breaks. No innerHTML, so
          // nothing needs escaping.
          const pre = container.createEl("pre");
          renderTrees(trees).forEach((line, i) => {
            if (i > 0) pre.appendText("\n");
            for (const segment of line) {
              if (segment.color) {
                pre.createSpan({ text: segment.text, cls: `sakura-${segment.color}` });
              } else {
                pre.appendText(segment.text);
              }
            }
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        container.createDiv({
          cls: "sakura-error",
          text: `Sakura could not render this block: ${message}`,
        });
      }
    });
  }

  onunload() {}
}

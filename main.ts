import { Plugin } from "obsidian";
import { tokenize } from "./src/tokenizer";
import { buildTrees } from "./src/treeBuilder";
import { validateTrees } from "./src/validator";
import { renderTrees } from "./src/renderer";

export default class SakuraPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("sakura", (source, el) => {
      // Style the Obsidian-provided wrapper to match our dark panel
      el.addClass("sakura-wrapper");

      const container = el.createEl("div", { cls: "sakura-container" });

      // Wrap the whole pipeline: Sakura is meant to be forgiving, so an
      // unexpected failure should surface a friendly message, never a blank
      // block or a thrown exception.
      try {
        const tokens = tokenize(source);
        const { trees, errors: buildErrors } = buildTrees(tokens);
        const validationErrors = validateTrees(trees);
        const allErrors = [...buildErrors, ...validationErrors];

        if (allErrors.length > 0) {
          const errorEl = container.createEl("div", { cls: "sakura-error" });
          errorEl.setText(
            allErrors
              .map(e => `Error${e.line ? ` (line ${e.line})` : ""}: ${e.message}`)
              .join("\n")
          );
        }

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
        container.createEl("div", {
          cls: "sakura-error",
          text: `Sakura could not render this block: ${message}`,
        });
      }
    });
  }

  onunload() {}
}

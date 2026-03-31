import { Plugin } from "obsidian";
import { tokenize } from "../src/tokenizer";
import { buildTrees } from "../src/treeBuilder";
import { validateTrees } from "../src/validator";
import { renderTrees } from "../src/renderer";

export default class SakuraPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("sakura", (source, el) => {
      // Style the Obsidian-provided wrapper to match our dark background
      el.addClass("sakura-wrapper");

      const container = el.createEl("div", { cls: "sakura-container" });

      // Run the pipeline directly so we can handle errors and output separately
      const tokens = tokenize(source);
      const { trees, errors: buildErrors } = buildTrees(tokens);
      const validationErrors = validateTrees(trees);
      const allErrors = [...buildErrors, ...validationErrors];

      if (allErrors.length > 0) {
        const errorEl = container.createEl("div", { cls: "sakura-error" });
        errorEl.textContent = allErrors
          .map(e => `Error${e.line ? ` (line ${e.line})` : ""}: ${e.message}`)
          .join("\n");
      }

      if (trees.length > 0) {
        const html = renderTrees(trees, "html");
        const pre = container.createEl("pre");
        pre.innerHTML = html;
      }
    });
  }

  onunload() {}
}

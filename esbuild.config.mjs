import esbuild from "esbuild";
import { argv } from "process";

const watch = argv.includes("--watch");

const context = await esbuild.context({
  entryPoints: ["main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  target: "es2020",
  outfile: "main.js",
  platform: "node",
  sourcemap: "inline",
  treeShaking: true,
});

if (watch) {
  await context.watch();
  console.log("Watching for changes...");
} else {
  await context.rebuild();
  await context.dispose();
}

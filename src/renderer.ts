import { SakuraTree, TreeNode } from './treeBuilder';

// Semantic color names. The actual color values live in styles.css as
// `.sakura-<name>` classes — the renderer never deals in hex, so nothing here
// has to know what theme or palette is in use.
export type ColorName =
  | 'gold' | 'yellow' | 'white' | 'blue' | 'lightblue' | 'bluegray'
  | 'green' | 'purple' | 'cyan' | 'red' | 'pink' | 'gray';

// One styled piece of a rendered line. A null color means "default text
// color" — used for the tree connectors (├── └── │).
export interface RenderSegment {
  text: string;
  color: ColorName | null;
}

// A rendered line is an ordered list of styled segments. The consumer (the
// Obsidian plugin) turns each segment into a DOM node — no HTML strings, so
// there is nothing to escape and no innerHTML.
export type RenderLine = RenderSegment[];

function getColor(node: TreeNode, isRoot: boolean): ColorName {
  if (node.type === 'comment') return 'gray';
  if (isRoot && node.type === 'directory') return 'gold';
  if (node.type === 'directory') return 'yellow';
  if (node.type === 'ellipsis') return 'white';

  // Lowercase so .PNG, .Json etc. color the same as their lowercase form.
  const ext = (node.extension ?? '').toLowerCase();
  if (['exe', 'ps1', 'sh', 'bat', 'cmd', 'py', 'rb', 'pl', 'lua', 'php', 'jar', 'msi'].includes(ext)) return 'blue';
  if (['json', 'xml', 'yaml', 'yml', 'toml', 'csv', 'env', 'ini'].includes(ext)) return 'green';
  if (['config', 'yang', 'conf', 'cfg', 'properties'].includes(ext)) return 'cyan';
  if (['md', 'rst', 'adoc', 'tex', 'mdx'].includes(ext)) return 'purple';
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'zip', 'tar', 'gz', '7z', 'iso', 'dmg', 'img', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'svg', 'mp3', 'mp4', 'wav'].includes(ext)) return 'red';
  if (['html', 'htm', 'css', 'scss', 'less', 'vue', 'svelte'].includes(ext)) return 'lightblue';
  if (['ts', 'js', 'jsx', 'tsx', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'java', 'kt', 'swift', 'zig', 'sql'].includes(ext)) return 'bluegray';
  if (ext === 'sakura') return 'pink';
  if (['txt', 'log', 'out'].includes(ext)) return 'white';
  return 'gray';
}

// A trailing slash is echoed only when the author actually typed one. An
// inferred folder renders without a slash — having children, and its color,
// already mark it as a folder, and that keeps Sakura readable for trees that
// aren't file systems at all.
function displayName(node: TreeNode): string {
  return node.type === 'directory' && node.explicitSlash ? node.name + '/' : node.name;
}

// Builds the styled segments for one node: its name, plus any inline comment.
function buildLabel(node: TreeNode, color: ColorName): RenderSegment[] {
  // Comment-only nodes render as "# comment text" in gray
  if (node.type === 'comment') {
    const text = node.comment ? `# ${node.comment}` : '#';
    return [{ text, color: 'gray' }];
  }
  // Normal node, optionally followed by an inline comment
  const segments: RenderSegment[] = [{ text: displayName(node), color }];
  if (node.comment) {
    segments.push({ text: `  # ${node.comment}`, color: 'gray' });
  }
  return segments;
}

export function renderTrees(trees: SakuraTree[]): RenderLine[] {
  const lines: RenderLine[] = [];
  trees.forEach((tree, i) => {
    if (i > 0) lines.push([]); // blank line between separate trees
    renderTree(tree, lines);
  });
  return lines;
}

function renderTree(tree: SakuraTree, lines: RenderLine[]): void {
  for (const node of tree.children) {
    renderNode(node, '', true, lines);
  }
}

function renderNode(
  node: TreeNode,
  prefix: string,
  isRoot: boolean,
  lines: RenderLine[]
): void {
  if (isRoot) {
    lines.push(buildLabel(node, getColor(node, true)));
  }

  const lastIndex = node.children.length - 1;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]!;
    const isLast = i === lastIndex;
    const connector = isLast ? '└── ' : '├── ';

    // The connector is an uncolored segment; the label carries the color.
    lines.push([
      { text: prefix + connector, color: null },
      ...buildLabel(child, getColor(child, false)),
    ]);

    if (child.children.length > 0) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      renderNode(child, newPrefix, false, lines);
    }
  }
}

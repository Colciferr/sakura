import { SakuraTree, TreeNode } from './treeBuilder';

export type RenderMode = 'ansi' | 'html';

// ANSI color codes
const ANSI = {
  gold:       '\x1b[38;5;214m',
  yellow:     '\x1b[93m',
  white:      '\x1b[37m',
  blue:       '\x1b[34m',
  lightblue:  '\x1b[38;5;117m',
  bluegray:   '\x1b[38;5;103m',
  green:      '\x1b[32m',
  purple:     '\x1b[35m',
  cyan:       '\x1b[96m',
  gray:       '\x1b[90m',
  red:        '\x1b[31m',
  pink:       '\x1b[38;5;213m',
  reset:      '\x1b[0m'
};

// HTML color values
const HTML_COLORS = {
  gold:       '#FFA726',
  yellow:     '#fffc32',
  white:      '#FFFFFF',
  blue:       '#4FC3F7',
  lightblue:  '#89CFF0',
  bluegray:   '#8899AA',
  green:      '#81C784',
  purple:     '#CE93D8',
  cyan:       '#80DEEA',
  red:        '#E57373',
  pink:       '#f59aff',
  gray:       '#AAAAAA'
};

type ColorName = Exclude<keyof typeof ANSI, 'reset'>;

// Escape HTML special characters to prevent XSS when rendering in HTML mode
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getColor(node: TreeNode, isRoot: boolean): ColorName {
  if (node.type === 'comment') return 'gray';
  if (isRoot && node.type === 'directory') return 'gold';
  if (node.type === 'directory') return 'yellow';
  if (node.type === 'ellipsis') return 'white';

  const ext = node.extension ?? '';
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

function colorize(text: string, color: ColorName, mode: RenderMode): string {
  if (mode === 'ansi') {
    return `${ANSI[color]}${text}${ANSI.reset}`;
  } 
  else {
    return `<span style="color: ${HTML_COLORS[color]}">${escapeHtml(text)}</span>`;
  }
}

export function renderTrees(trees: SakuraTree[], mode: RenderMode): string {
  return trees.map(tree => renderTree(tree, mode)).join('\n\n');
}

function renderTree(tree: SakuraTree, mode: RenderMode): string {
  const lines: string[] = [];

  if (tree.target) {
    lines.push(mode === 'html' ? escapeHtml(tree.target) : tree.target);
  }

  for (const node of tree.children) {
    renderNode(node, '', true, lines, mode);
  }

  return lines.join('\n');
}

// Builds the display text for a node, including any inline comment
function buildLabel(node: TreeNode, color: ColorName, mode: RenderMode): string {
  // Comment-only nodes: render as "# comment text" in gray
  if (node.type === 'comment') {
    const text = node.comment ? `# ${node.comment}` : '#';
    return colorize(text, 'gray', mode);
  }
  // Normal nodes, optionally followed by an inline comment
  let label = colorize(node.name, color, mode);
  if (node.comment) {
    label += '  ' + colorize(`# ${node.comment}`, 'gray', mode);
  }
  return label;
}

function renderNode(
  node: TreeNode,
  prefix: string,
  isRoot: boolean,
  lines: string[],
  mode: RenderMode
): void {
  const color = getColor(node, isRoot);
  const label = buildLabel(node, color, mode);

  if (isRoot) {
    lines.push(label);
  }

  const lastIndex = node.children.length - 1;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]!;
    const isLast = i === lastIndex;
    const connector = isLast ? '└── ' : '├── ';
    const childLabel = buildLabel(child, getColor(child, false), mode);

    lines.push(prefix + connector + childLabel);

    if (child.children.length > 0) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      renderNode(child, newPrefix, false, lines, mode);
    }
  }
}
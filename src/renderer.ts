import { SakuraTree, TreeNode } from './treeBuilder';

export type RenderMode = 'ansi' | 'html';

// ANSI color codes
const ANSI = {
  gold:       '\x1b[38;5;214m',
  yellow:     '\x1b[93m',
  white:      '\x1b[37m',
  blue:       '\x1b[34m',
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
  green:      '#81C784',
  purple:     '#CE93D8',
  cyan:       '#80DEEA',
  red:        '#E57373',
  pink:       '#f59aff',
  gray:       '#AAAAAA'
};

type ColorName = Exclude<keyof typeof ANSI, 'reset'>;

function getColor(node: TreeNode, isRoot: boolean): ColorName {
  if (isRoot && node.type === 'directory') return 'gold';
  if (node.type === 'directory') return 'yellow';
  if (node.type === 'ellipsis') return 'white';

  const ext = node.extension ?? '';
  if (['exe', 'ps1', 'sh', 'bat', 'cmd', 'py'].includes(ext)) return 'blue';
  if (['json', 'xml'].includes(ext)) return 'green';
  if (['config', 'yang'].includes(ext)) return 'cyan';
  if (ext === 'md') return 'purple';
  if (ext === 'pdf') return 'red';
  if (ext === 'sakura') return 'pink';
  if (ext === 'txt') return 'white';
  return 'gray';
}

function colorize(text: string, color: ColorName, mode: RenderMode): string {
  if (mode === 'ansi') {
    return `${ANSI[color]}${text}${ANSI.reset}`;
  } 
  else {
    return `<span style="color: ${HTML_COLORS[color]}">${text}</span>`;
  }
}

export function renderTrees(trees: SakuraTree[], mode: RenderMode): string {
  return trees.map(tree => renderTree(tree, mode)).join('\n\n');
}

function renderTree(tree: SakuraTree, mode: RenderMode): string {
  const lines: string[] = [];

  if (tree.target) {
    lines.push(tree.target);
  }

  for (const node of tree.children) {
    renderNode(node, '', true, lines, mode);
  }

  return lines.join('\n');
}

function renderNode(
  node: TreeNode,
  prefix: string,
  isRoot: boolean,
  lines: string[],
  mode: RenderMode
): void {
  const color = getColor(node, isRoot);
  const label = colorize(node.name, color, mode);

  if (isRoot) {
    lines.push(label);
  }

  const lastIndex = node.children.length - 1;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]!;
    const isLast = i === lastIndex;
    const connector = isLast ? '└── ' : '├── ';
    const childColor = getColor(child, false);
    const childLabel = colorize(child.name, childColor, mode);

    lines.push(prefix + connector + childLabel);

    if (child.children.length > 0) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      renderNode(child, newPrefix, false, lines, mode);
    }
  }
}
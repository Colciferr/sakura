import { SakuraTree, TreeNode, BuildError } from './treeBuilder';

// Sakura is intentionally forgiving — almost anything renders. The one
// remaining guard is structural: an ellipsis means "more siblings here",
// which is meaningless at the root level where there is no parent.
export function validateTrees(trees: SakuraTree[]): BuildError[] {
  const errors: BuildError[] = [];

  for (const tree of trees) {
    for (const node of tree.children) {
      validateNode(node, 0, errors);
    }
  }

  return errors;
}

function validateNode(node: TreeNode, depth: number, errors: BuildError[]): void {
    // ellipsis at root level
    if(node.type === 'ellipsis' && depth === 0) {
        errors.push({ message: "Syntax error: ellipsis is not allowed at the root level" });
    }

    // recurse into children
    for(const child of node.children) {
        validateNode(child, depth + 1, errors);
    }
}

import { SakuraTree, TreeNode, BuildError } from './treeBuilder';

export function validateTrees(trees: SakuraTree[]): BuildError[] {
  const errors: BuildError[] = [];

  for (const tree of trees) {
    validateTree(tree, errors);
  }

  return errors;
}

function validateTree(tree: SakuraTree, errors: BuildError[]): void {
    // multiple roots without a target
    if (!tree.target && tree.children.length > 1) {
        errors.push({ message: "Syntax error: multiple root entries require a target declaration" });
    }

    // walk each root-level child
    for(const node of tree.children) {
        validateNode(node, 0 , errors);
    }
}

function validateNode(node: TreeNode, depth: number, errors: BuildError[]): void {
    // ellipsis at root level
    if(node.type === 'ellipsis' && depth === 0) {
        errors.push({ message: "Syntax error: ellipsis is not allowed at the root level" });
    }

    // invalid Windows filename characters
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    if (node.type !== 'ellipsis' && invalidChars.test(node.name.replace(/\/$/, ''))) {
        errors.push({ message: `Syntax error: invalid filename characters in '${node.name}'` });
    }

    // recurse into children
    for(const child of node.children) {
        validateNode(child, depth + 1, errors);
    }
}
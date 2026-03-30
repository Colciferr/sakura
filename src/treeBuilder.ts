import { Token, TokenType } from "./tokenizer";

export type NodeType = 'directory' | 'file' | 'ellipsis';

export interface TreeNode {
    type: NodeType;
    name: string;
    extension?: string;
    children: TreeNode[];
}

export interface SakuraTree {
    target?: string;
    children: TreeNode[];
}

export interface BuildError {
    message: string;
    line?: number;
}

export interface BuildResult {
    trees: SakuraTree[];
    errors: BuildError[];
}

export function buildTrees(tokens: Token[]): BuildResult {
    const trees: SakuraTree[] = [];
    const errors: BuildError[] = [];

    let currentTree: SakuraTree = { children: [] };
    const stack: { node: TreeNode; depth: number }[] = [];

    for (const token of tokens) {
        switch (token.type) {

            // skipped cases
            case 'COMMENT':
            case 'BLANK':
                break;
            
            // stamped onto the current tree
            case 'TARGET': {
                const path = token.name
                    .replace(/^target:\s*/, '')
                    .replace(/^['"]|['"]$/g, '')
                    .trim();

                if(currentTree.target !== undefined) {
                    errors.push({ message: 'Unexpected target: duplicate target declaration in the same block', line: token.line });
                    break;
                }

                if(currentTree.children.length > 0) {
                    errors.push({ message: 'Unexpected target: target must be declared before the root', line: token.line });
                    break;
                }

                if(path === '') {
                    // treat as no target, per spec
                    break;
                }

                currentTree.target = path;
                break;
                }

            // seals the current tree, pushes it, & resets both tree and stack for the next block
            case 'SEPARATOR':
                if(currentTree.children.length > 0) {
                    trees.push(currentTree);
                }
                currentTree = { children: [] };
                stack.length = 0;
                break;

            case 'DIRECTORY':
            case 'FILE':
            case 'ELLIPSIS': {
                const nodeType: NodeType =
                    token.type === 'DIRECTORY' ? 'directory' :
                    token.type === 'ELLIPSIS' ? 'ellipsis' : 'file';
                
                const node: TreeNode = {
                    type: nodeType,
                    name: token.name,
                    children: []
                };

                if(nodeType === 'file') {
                    const parts = token.name.split('.')
                    if(parts.length > 1) {
                        node.extension = parts[parts.length - 1] ?? '';
                    }
                }

                // Validate that indentation doesn't skip levels (e.g. depth 0 -> depth 2)
                const expectedMaxDepth = stack.length === 0 ? 0 : stack[stack.length - 1]!.depth + 1;
                if (token.depth > expectedMaxDepth) {
                    errors.push({
                        message: `Invalid indentation: jumped from depth ${expectedMaxDepth - 1} to ${token.depth} (skipped a level)`,
                        line: token.line
                    });
                    break;
                }

                while(stack.length > 0 && stack[stack.length - 1]!.depth >= token.depth) {
                    stack.pop();
                }

                if(stack.length === 0) {
                    currentTree.children.push(node);
                }
                else {
                    stack[stack.length - 1]?.node.children.push(node);
                }

                if(nodeType === 'directory') {
                    stack.push({ node, depth: token.depth });
                }

                break;
            }
        }
    }

    if(currentTree.children.length > 0) {
        trees.push(currentTree);
    }

    return {trees, errors};
}

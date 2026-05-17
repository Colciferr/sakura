import { Token } from "./tokenizer";

export type NodeType = 'directory' | 'file' | 'ellipsis' | 'comment';

export interface TreeNode {
    type: NodeType;
    name: string;
    extension?: string | undefined;
    comment?: string | undefined;
    // True only when the author typed a trailing slash. An inferred folder
    // (detected from nesting, or a bare word) leaves this false. The renderer
    // uses it to echo the slash exactly as written, no more.
    explicitSlash?: boolean | undefined;
    children: TreeNode[];
}

export interface SakuraTree {
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

            // Hidden comments and blank lines are skipped
            case 'BLANK':
                break;

            // Visible comments are placed in the tree at their depth level
            case 'COMMENT': {
                const commentNode: TreeNode = {
                    type: 'comment',
                    name: '',
                    comment: token.comment,
                    children: []
                };

                while(stack.length > 0 && stack[stack.length - 1]!.depth >= token.depth) {
                    stack.pop();
                }

                if(stack.length === 0) {
                    currentTree.children.push(commentNode);
                }
                else {
                    stack[stack.length - 1]?.node.children.push(commentNode);
                }
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
                // Tentative type. A FILE that turns out to have children gets
                // promoted to a directory in the finalize pass below — that
                // promotion is what makes the trailing slash optional.
                const nodeType: NodeType =
                    token.type === 'DIRECTORY' ? 'directory' :
                    token.type === 'ELLIPSIS' ? 'ellipsis' : 'file';

                const node: TreeNode = {
                    type: nodeType,
                    name: token.name,
                    comment: token.comment,
                    explicitSlash: token.type === 'DIRECTORY',
                    children: []
                };

                while(stack.length > 0 && stack[stack.length - 1]!.depth >= token.depth) {
                    stack.pop();
                }

                if(stack.length === 0) {
                    currentTree.children.push(node);
                }
                else {
                    stack[stack.length - 1]?.node.children.push(node);
                }

                // Anything except an ellipsis may turn out to be a parent, so
                // keep it on the stack as a possible attach point for children.
                if(nodeType !== 'ellipsis') {
                    stack.push({ node, depth: token.depth });
                }

                break;
            }
        }
    }

    if(currentTree.children.length > 0) {
        trees.push(currentTree);
    }

    // Resolve every node's final type now that its children are known.
    for (const tree of trees) {
        for (const node of tree.children) {
            finalizeNode(node);
        }
    }

    return {trees, errors};
}

// Well-known extensionless FILES, matched case-insensitively. A bare word with
// no extension is normally treated as a folder (see finalizeNode); these are
// the exceptions — the small, stable set of files that conventionally carry
// no extension. Extend this list if a common one is missing.
const KNOWN_EXTENSIONLESS_FILES = new Set([
    'readme', 'license', 'licence', 'copying', 'copyright', 'authors',
    'contributors', 'contributing', 'changelog', 'changes', 'history',
    'notice', 'install', 'news', 'todo', 'version',
    'dockerfile', 'containerfile', 'makefile', 'gnumakefile', 'rakefile',
    'gemfile', 'guardfile', 'procfile', 'vagrantfile', 'jenkinsfile',
    'brewfile', 'caddyfile', 'justfile', 'berksfile', 'capfile', 'podfile',
]);

// Resolves a node's final type now that the whole tree is built. A token
// tentatively tagged 'file' (no trailing slash) is reclassified here:
//   - has children            -> directory (things are nested under it)
//   - has a .extension         -> file     (extension recorded for coloring)
//   - bare word, known file    -> file     (README, LICENSE, Dockerfile, ...)
//   - bare word, anything else -> directory (a folder-structure tool's best
//                                            guess for an unadorned word)
// A trailing slash always wins — those arrive already typed 'directory'.
function finalizeNode(node: TreeNode): void {
    if(node.type === 'file') {
        if(node.children.length > 0) {
            node.type = 'directory';
        }
        else {
            const parts = node.name.split('.');
            if(parts.length > 1) {
                node.extension = parts[parts.length - 1] ?? '';
            }
            else if(!KNOWN_EXTENSIONLESS_FILES.has(node.name.toLowerCase())) {
                node.type = 'directory';
            }
        }
    }

    for(const child of node.children) {
        finalizeNode(child);
    }
}

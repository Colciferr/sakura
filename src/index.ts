import { tokenize } from './tokenizer';
import { buildTrees } from './treeBuilder';
import { validateTrees } from './validator';
import { renderTrees, RenderMode } from './renderer';

export function sakura(input: string, mode: RenderMode = 'ansi'): string {
    const tokens = tokenize(input);
    const { trees, errors: buildErrors } = buildTrees(tokens);
    const validationErrors = validateTrees(trees);

    const allErrors = [...buildErrors, ...validationErrors];

    if(allErrors.length > 0) {
        return allErrors
            .map(error => `Error${error.line ? ` (line ${error.line})` : ''}: ${error.message}`)
            .join('\n');
    }

    return renderTrees(trees, mode);
}
import sourceMap from 'source-map';

const SourceMapGenerator = sourceMap.SourceMapGenerator;

function isNode(node) {
  return typeof node === 'object' && !!node.type;
}

export function visit(ast, callback) {
  callback(ast);
  const keys = Object.keys(ast);
  for (let i = 0; i < keys.length; i++) {
    const keyName = keys[i];
    const child = ast[keyName];
    if (keyName === 'loc') return;
    if (Array.isArray(child)) {
      for (let j = 0; j < child.length; j++) {
        visit(child[j], callback);
      }
    } else if (isNode(child)) {
      visit(child, callback);
    }
  }
}

/*
 * Shallow clone.
 * Pass-by-ref so write to reference
 * clone does not have original on
 */
export const cloneOriginalOnAst = (ast) => {
  visit(ast, (node) => {
    const clone = Object.assign({}, node);
    node.original = clone;
  });
  console.log(ast);
};

export const genSourceMap = (sourceAst) => {
  // 1. add shallow clone of each node onto AST
  cloneOriginalOnAst(sourceAst);
};

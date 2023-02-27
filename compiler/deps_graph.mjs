import path from 'path';
import fs from 'fs';
import ast from 'abstract-syntax-tree';

const depsArray = [];

const depsGragh = (file) => {
  const fullPath = path.resolve('./examples/', file);

  // return early if exists
  if (!!depsArray.find((item) => item.name === fullPath)) return;

  const fileContents = fs.readFileSync(fullPath, 'utf-8');
  const source = ast.parse(fileContents, { loc: true });
  const module = {
    name: fullPath,
    source,
  };

  depsArray.push(module);

  source.body.map((current) => {
    if (current.type === 'ImportDeclaration') {
      depsGragh(current.source.value);
    }
  });

  return { depsArray, sourceAst: source };
};

export { depsGragh };

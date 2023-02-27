import ast from 'abstract-syntax-tree';
import path from 'path';

/**
 * Template to be used for each module.
 * module: load exports onto
 * _ourRequire: import system
 */

const buildModuleTemplateString = (
  moduleCode,
  index,
) => `/* index/id ${index} */
(function(module, _ourRequire) {
  "use strict";
  ${moduleCode}
})`;

// Our main template containing the bundles runtime.
const buildRuntimeTemplateString = (allModules) => `(function (modules) {
  // Define runtime.
  const installedModules = {}; // id/index + exports
  function _our_require_(moduleId) {
    // Module in cache?
    if (installedModules[moduleId]) {
      // return function exported in module
      return installedModules[moduleId].exports;
    }

    // Build module, store exports against this ref.
    const module = {
      i: moduleId,
      exports: {}
    };

    // Execute module template function. Add exports to ref.
    modules[moduleId](module, _our_require_);

    // cache exports of module
    const exports = module.exports;
    installedModules[moduleId] = exports;

    // return exports of module
    return exports;
  }

  // Load entry module via id + return exports
  return _our_require_(0);
})([
  ${allModules}
]);`;

/**
 * Replacing ESM import with our function.
 * `const someImport = _ourRequire("{ID}");`
 */
const getImport = (item, allDeps) => {
  // get variable we import onto
  const properties = item.specifiers.map((specifier) => ({
    type: 'Property',
    kind: 'init',
    key: {
      type: 'Identifier',
      name: specifier.imported.name,
    },
    value: {
      type: 'Identifier',
      name: specifier.imported.name,
    },
  }));
  // get files full path and find index in deps array.
  const fullFile = path.resolve('./examples/', item.source.value);
  const itemId = allDeps.findIndex((item) => item.name === fullFile);

  return {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        init: {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: '_ourRequire',
          },
          arguments: [
            {
              type: 'Literal',
              value: itemId,
            },
          ],
        },
        id: {
          type: 'ObjectPattern',
          properties,
        },
      },
    ],
  };
};

/*
 * Replacing ESM export with our function.
 * `module.exports = someFunction;`
 */
const getExport = (item) => {
  // get export functions name
  const properties = item.specifiers.map((specifier) => ({
    type: 'Property',
    kind: 'init',
    key: {
      type: 'Identifier',
      name: specifier.exported.name,
    },
    value: {
      type: 'Identifier',
      name: specifier.exported.name,
    },
  }));
  return {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      left: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'module' },
        computed: false,
        property: { type: 'Identifier', name: 'exports' },
      },
      operator: '=',
      right: {
        type: 'ObjectExpression',
        properties,
      },
    },
  };
};

/*
 * Take depsArray and return bundle string
 */
const transfrom = (depsArray) => {
  const updateModules = depsArray.reduce((acc, dependency, index) => {
    const updateAst = dependency.source.body.map((item) => {
      if (item.type === 'ImportDeclaration') {
        // replace module imports with ours
        item = getImport(item, depsArray);
      }
      if (item.type === 'ExportNamedDeclaration') {
        // replaces function name with real exported function
        item = getExport(item);
      }
      return item;
    });
    dependency.source.body = updateAst;

    // Turn AST back into string
    const updatedSource = ast.generate(dependency.source);

    // Bind module source to module template
    const updatedTemplate = buildModuleTemplateString(updatedSource, index);
    acc.push(updatedTemplate);
    return acc;
  }, []);

  // Add all modules to bundle
  const bundleString = buildRuntimeTemplateString(updateModules.join(','));
  return bundleString;
};

export { transfrom };

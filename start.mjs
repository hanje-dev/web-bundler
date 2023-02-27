import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { minify } from 'terser';
import { depsGragh } from './compiler/deps_graph.mjs';
import { transfrom } from './compiler/transform.mjs';
import { genSourceMap } from './compiler/source_map.mjs';

(async () => {
  // 1. Traverse deps graph
  const entry = './fileA.mjs';
  const { depsArray, sourceAst } = depsGragh(entry);
  genSourceMap(sourceAst);

  // 2. Transform to bundle
  const vendorString = transfrom(depsArray);

  // 3. Minify code
  const minifyResult = await minify(vendorString, { sourceMap: true });

  // 4. Write to bundle + mainfest
  // create hash
  const sum = crypto.createHash('shake256', { outputLength: 4 });
  const mapCode =
    minifyResult.code + '\n' + '//# sourceMappingURL=./bundle.js.map';
  sum.update(mapCode);
  const hash = sum.digest('hex');
  // write contents to bundle
  fs.writeFileSync(`./build/bundle-${hash}.js`, mapCode, 'utf-8');
  fs.writeFileSync('./build/bundle.js.map', minifyResult.map, 'utf-8');
  // write hash to manifest
  fs.writeFileSync(
    './build/manifest.json',
    `{"bundle": "bundle-${hash}.js"}`,
    'utf-8',
  );

  console.log('FINISHED :)');
})();

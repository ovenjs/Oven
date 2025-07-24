import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

const packages = ['core', 'ws', 'rest', 'types', 'builders'];

export default packages.flatMap(pkg => [
  // ESM build
  defineConfig({
    input: `packages/${pkg}/src/index.ts`,
    output: {
      file: `packages/${pkg}/dist/index.js`,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
    external: ['ws', 'node-fetch', /^@ovenjs\//],
  }),
  // Type definitions
  defineConfig({
    input: `packages/${pkg}/src/index.ts`,
    output: {
      file: `packages/${pkg}/dist/index.d.ts`,
      format: 'esm',
    },
    plugins: [dts()],
  }),
]);
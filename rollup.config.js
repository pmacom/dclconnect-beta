import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import externals from 'rollup-plugin-node-externals'
import { terser } from 'rollup-plugin-terser';
// import DCLDash from 'dcldash'


const packageJson = require('./package.json');
const PROD = !!process.env.CI

export default {
  input: 'src/index.ts',
  context: 'globalThis',
  output: [
    {
      file: packageJson.main,
      format: 'amd',
      amd: {
        id: packageJson.name
      },
    },
  ],
  plugins: [
    externals(),
    resolve({
      preferBuiltins: true,
      browser: true,
    }),
    typescript({ tsconfig: './tsconfig.json' }),
    commonjs({
      exclude: 'node_modules',
      ignoreGlobal: true,
      // transformMixedEsModules: true,
      // namedExports: {
      //   'dcldash': Object.keys(DCLDash),
      // }
    }),
    PROD && terser({ format: { comments: false } }),
  ],
};
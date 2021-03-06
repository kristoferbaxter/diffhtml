import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import Visualizer from 'rollup-plugin-visualizer';

const entries = {
  min: 'lib/index.js',
  umd: 'lib/index.js',
};

const dests = {
  min: 'dist/synthetic-events.min.js',
  umd: 'dist/synthetic-events.js',
}

const { NODE_ENV = 'umd' } = process.env;

export const input = entries[NODE_ENV];
export const context = 'this';
export const external = ['diffhtml'];

export const output = [{
  dest: dests[NODE_ENV],
  format: 'umd',
  exports: 'default',
  name: 'syntheticEvents',
  sourcemap: false,
  globals: { diffhtml: 'diff' },
}];

export const plugins = [
  NODE_ENV === 'min' && replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
  babel(),
  nodeResolve({ mainFields: ['module'] }),
  NODE_ENV === 'umd' && Visualizer({ filename: './dist/build-size.html' }),
];

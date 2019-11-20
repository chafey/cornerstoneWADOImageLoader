// ~~ Paths
const path = require('path');
const REPO_ROOT = process.cwd();
const SRC_PATH = path.join(REPO_ROOT, 'src');
const OUTPUT_PATH = path.join(REPO_ROOT, 'dist');
const codecs = path.join(REPO_ROOT, 'src', 'shared', 'codecs');
// ~~ Plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  context: SRC_PATH,
  // Relative to context
  entry: {
    cornerstoneWADOImageLoader: './index.js',
  },
  target: 'web',
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: '/',
    path: OUTPUT_PATH,
    //
    library: '[name]',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
  },
  devtool: 'source-map',
  externals: {
    'dicom-parser': {
      commonjs: 'dicom-parser',
      commonjs2: 'dicom-parser',
      amd: 'dicom-parser',
      root: 'dicomParser',
    },
  },
  module: {
    noParse: [/(codecs)/],
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: [/(node_modules)/, /(codecs)/],
        loader: 'eslint-loader',
        options: {
          failOnError: true,
        },
      },
      // If we import a file with this syntax...?
      // What if it's the entry point?
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: {
            // inline: false,
            // fallback: false,
            name: 'worker.[hash].js', // [hash]
          },
        },
      },
      {
        test: /\.js$/,
        exclude: [/(node_modules)/, /(codecs)/],
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    // Clean output.path
    new CleanWebpackPlugin(),
  ],
  node: { fs: 'empty' },
};

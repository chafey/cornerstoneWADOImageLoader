// ~~ Paths
const path = require('path');
const REPO_ROOT = process.cwd();
const SRC_PATH = path.join(REPO_ROOT, 'src');
const OUTPUT_PATH = path.join(REPO_ROOT, 'dist');
const codecs = path.join(REPO_ROOT, 'src', 'shared', 'codecs');
// ~~ Plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = {
  mode: 'development',
  context: SRC_PATH,
  // Paths relative to `context`
  entry: {
    cornerstoneWADOImageLoader: './imageLoader/index.js',
    cornerstoneWADOImageLoaderWebWorker: './webWorker/index.worker.js',
  },
  target: 'web',
  output: {
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
    globalObject: 'this',
    path: OUTPUT_PATH,
    umdNamedDefine: true,
  },
  devtool: 'source-map',

  module: {
    noParse: [/(codecs)/],
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'eslint-loader',

        options: {
          failOnError: true,
        },
      },
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: { inline: true, fallback: false },
        },
      },
      {
        test: path.join(codecs, 'openJPEG-FixedMemory.js'),
        use: 'exports-loader?OpenJPEG',
      },
      {
        test: path.join(codecs, 'charLS-FixedMemory-browser.js'),
        use: 'exports-loader?CharLS',
      },
      {
        test: path.join(codecs, 'jpeg.js'),
        use: 'exports-loader?JpegImage',
      },
      {
        test: path.join(codecs, 'jpx.min.js'),
        use: 'exports-loader?JpxImage',
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
    //
    new BundleAnalyzerPlugin(),
  ],
  // Caused by `fs` in a codec
  node: { fs: 'empty' },
  externals: {
    'dicom-parser': {
      commonjs: 'dicom-parser',
      commonjs2: 'dicom-parser',
      amd: 'dicom-parser',
      root: 'dicomParser',
    },
  },
};

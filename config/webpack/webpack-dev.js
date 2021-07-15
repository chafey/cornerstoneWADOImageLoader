// ~~ Webpack
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack-base');
// ~~ Plugins
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// ~~ Paths
const PUBLIC_DIR = path.join(__dirname, '../..', 'public');
const DIST_DIR = path.join(__dirname, '../..', 'dist');

const devConfig = {
  devServer: {
    hot: true,
    open: true,
    port: 3000,
    public: 'http://localhost:' + 3000,
    // publicPath: '/dist/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin({}),
    // Copy "Public" Folder to Dist
    new CopyWebpackPlugin([
      {
        from: PUBLIC_DIR,
        to: DIST_DIR,
        toType: 'dir',
        // Ignore our HtmlWebpackPlugin template file
        ignore: ['index.html'],
      },
    ]),
    //
    new HtmlWebpackPlugin({
      template: path.join(PUBLIC_DIR, 'index.html'),
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      template: path.join(PUBLIC_DIR, 'react-cornerstone-viewport.html'),
      filename: 'react-cornerstone-viewport.html',
      inject: 'head',
    }),
    new HtmlWebpackPlugin({
      template: path.join(PUBLIC_DIR, 'wadors.html'),
      filename: 'wadors.html',
      inject: 'head',
    }),
  ],
};

module.exports = merge(baseConfig, devConfig);

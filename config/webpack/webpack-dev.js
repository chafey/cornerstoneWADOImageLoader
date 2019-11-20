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
      // templateParameters: {
      //   PUBLIC_URL: PUBLIC_URL,
      // },
    }),
  ],
};

module.exports = merge(baseConfig, devConfig);

const _ = require('lodash');
const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const VENDOR_LIBS = _.keys(require('./package.json').dependencies);
const NODE_DIR = path.join(__dirname, 'node_modules');
const BROKEN_SRC_MAPS = [
  path.join(NODE_DIR, '@blueprintjs')
];

let config = {
  entry: {
    app: './dev/index.ts',
    vendor: VENDOR_LIBS
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dev/docs'),
    publicPath: '/'
  },
  devtool: '#source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.json', '.ts', '.js', '.tsx']
  },
  module: {
    loaders: [
      { test: /\.html$/, loader: 'html' },
      { test: /\.tsx?$/, loader: 'ts' },
      { test: /node_modules.*\.js$/, loader: 'source-map-loader', exclude: BROKEN_SRC_MAPS },
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.eot$/, loader: 'file' },
      { test: /\.less/, loader: 'style!css?sourceMap!less?sourceMap' }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity
    }),
    new HtmlWebpackPlugin({
      template: './dev/index-template.html',
      filename: 'index.html'
    })
  ]
};

module.exports = config;

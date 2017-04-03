const webpack = require('webpack');

let config = require('./webpack.config.base.js');

config.plugins.push(new webpack.DefinePlugin({
  // This is a macro substitution; it has to end up in the source with quotes.
  'process.env.NODE_ENV': '"production"'
}));

// Finds duplicate files and collapses them to reduce bundle size
config.plugins.push(new webpack.optimize.DedupePlugin());

config.plugins.push(new webpack.optimize.UglifyJsPlugin({
  compress: {
    warnings: false
  },
  sourceMap: true
}));

module.exports = config;

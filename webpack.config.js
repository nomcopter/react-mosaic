const webpack = require('webpack');

let config = require('./webpack.config.base.js');

config.plugins.push(new webpack.DefinePlugin({
  // This is a macro substitution; it has to end up in the source with quotes.
  'process.env.NODE_ENV': '"production"'
}));

config.plugins.push(new webpack.optimize.UglifyJsPlugin({
  compress: {
    warnings: false
  }
}));

module.exports = config;

const _ = require('lodash');
const webpack = require('webpack');

let config = require('./webpack.config.base.js');

// Re-configure the app entry point for hot-reloading by injecting this pseudo-module provided by webpack.
config.entry.app = _.flatten([
  'react-hot-loader/patch',
  'webpack/hot/only-dev-server',
  config.entry.app
]);

config.module.loaders.forEach(loaderConf => {
  if (loaderConf.loader.slice(0, 2) === 'ts') {
    loaderConf.loader = 'react-hot-loader/webpack!' + loaderConf.loader;
  }
});

config.plugins.push(new webpack.DefinePlugin({
  'process.env.NODE_ENV': 'null'
}));

_.merge(config, {
  devtool: '#cheap-module-source-map',
  devServer: {
    historyApiFallback: true,
    stats: 'minimal',
    proxy: []
  }
});

module.exports = config;

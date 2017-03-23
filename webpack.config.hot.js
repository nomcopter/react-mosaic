const _ = require('lodash');
const webpack = require('webpack');

let config = require('./webpack.config.base.js');

config.module.loaders.forEach(loaderConf => {
  if (loaderConf.loader.slice(0, 2) === 'ts') {
    loaderConf.loader = 'react-hot!' + loaderConf.loader;
  }
});

config.plugins.push(new webpack.DefinePlugin({
  'process.env.NODE_ENV': 'null'
}));

_.merge(config, {
  devtool: '#cheap-module-source-map',
  ts: {
    transpileOnly: true
  },
  devServer: {
    historyApiFallback: true,
    stats: 'minimal',
    proxy: []
  }
});

module.exports = config;

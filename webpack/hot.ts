import * as _ from 'lodash';
import * as webpack from 'webpack';
import config from './base';
import { CONSTANTS } from './constants';

const entry = config.entry as webpack.Entry;
entry.app = _.flatten([
  'react-hot-loader/patch',
  // activate HMR for React

  'webpack-dev-server/client?http://localhost:' + CONSTANTS.DEV_SERVER_PORT,
  // bundle the client for webpack-dev-server
  // and connect to the provided endpoint

  'webpack/hot/only-dev-server',
  // bundle the client for hot reloading
  // only- means to only hot reload for successful updates
  entry.app,
]);

(config.module as webpack.NewModule).rules.forEach((loaderConf: any) => {
  if (loaderConf.test.test('test.ts')) {
    loaderConf.use = _.flatten([{
        loader: 'react-hot-loader/webpack',
      },
      loaderConf.use,
    ]);
  }
});

config.plugins!.push(
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': 'null',
  }),
);

config.plugins!.push(
  new webpack.HotModuleReplacementPlugin(),
);

_.merge(config, {
  devtool: '#cheap-module-source-map',
  devServer: {
    contentBase: CONSTANTS.DOCS_DIR,
    historyApiFallback: true,
    hot: true,
    stats: 'minimal',
    port: CONSTANTS.DEV_SERVER_PORT,
    open: true,
  },
});

export default config;

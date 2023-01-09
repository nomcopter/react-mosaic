import webpack from 'webpack';
import config from './base';
import { CONSTANTS } from './constants';
import 'webpack-dev-server';

const baseEntry = config.entry as webpack.EntryObject;
const entry = {
  ...baseEntry,
  app: [
    // activate HMR for React
    'react-hot-loader/patch',

    // bundle the client for webpack-dev-server
    // and connect to the provided endpoint
    'webpack-dev-server/client?http://localhost:' + CONSTANTS.DEV_SERVER_PORT,

    // bundle the client for hot reloading
    // only- means to only hot reload for successful updates
    'webpack/hot/only-dev-server',
    baseEntry.app as string,
  ],
};

const rules = (config.module as webpack.ModuleOptions).rules?.map((loaderConf: any) => {
  if (loaderConf.test.test('test.ts')) {
    return {
      ...loaderConf,
      use: [
        {
          loader: 'react-hot-loader/webpack',
        },
        ...loaderConf.use,
      ],
    };
  } else {
    return loaderConf;
  }
});
const module = {
  ...config.module,
  rules,
};

const hotConfig: webpack.Configuration = {
  ...config,
  mode: 'development',
  entry,
  module,
  devtool: 'cheap-module-source-map',
  stats: 'minimal',
  optimization: {
    runtimeChunk: 'single',
  },
  devServer: {
    static: CONSTANTS.DOCS_DIR,
    historyApiFallback: true,
    hot: true,
    host: '0.0.0.0',
    port: CONSTANTS.DEV_SERVER_PORT,
    open: true,
  },
};

// tslint:disable-next-line no-default-export
export default hotConfig;

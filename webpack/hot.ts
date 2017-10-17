import * as webpack from 'webpack';
import config from './base';
import { CONSTANTS } from './constants';

const baseEntry = config.entry as webpack.Entry;
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

const rules = (config.module as webpack.NewModule).rules.map((loaderConf: any) => {
  if (loaderConf.test.test('test.ts')) {
    return {
      ...loaderConf,
      use: [{
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

const plugins = [
  ...(config.plugins || []),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': 'null',
  }),
  new webpack.HotModuleReplacementPlugin(),
];

const hotConfig = {
  ...config,
  entry,
  module,
  plugins,
  devtool: '#cheap-module-source-map',
  devServer: {
    contentBase: CONSTANTS.DOCS_DIR,
    historyApiFallback: true,
    hot: true,
    stats: 'minimal',
    port: CONSTANTS.DEV_SERVER_PORT,
    open: true,
  },
};

export default hotConfig;

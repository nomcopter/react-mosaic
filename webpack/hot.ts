import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import webpack from 'webpack';
import 'webpack-dev-server';
import config from './base';
import { CONSTANTS } from './constants';

const hotConfig: webpack.Configuration = {
  ...config,
  mode: 'development',
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
  },
  plugins: [...(config.plugins || []), new ReactRefreshWebpackPlugin()],
};

// tslint:disable-next-line no-default-export
export default hotConfig;

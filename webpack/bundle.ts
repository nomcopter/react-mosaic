import * as webpack from 'webpack';
import config from './base';

const bundleConfig = {
  ...config,
  plugins: [
    ...(config.plugins || []),
    new webpack.DefinePlugin({
      // This is a macro substitution; it has to end up in the source with quotes.
      'process.env.NODE_ENV': '"production"',
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
    }),
  ],
};

export default bundleConfig;

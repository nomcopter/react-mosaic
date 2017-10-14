import * as webpack from 'webpack';
import config from './base';

config.plugins!.push(new webpack.DefinePlugin({
  // This is a macro substitution; it has to end up in the source with quotes.
  'process.env.NODE_ENV': '"production"',
}));

config.plugins!.push(
  new webpack.optimize.UglifyJsPlugin({
    sourceMap: true,
  }),
);

config.plugins!.push(
  new webpack.LoaderOptionsPlugin({
    minimize: true,
  }),
);

export default config;

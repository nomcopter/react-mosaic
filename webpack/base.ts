import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as webpack from 'webpack';
import { CONSTANTS } from './constants';

// tslint:disable-next-line no-var-requires
const VENDOR_LIBS = Object.keys(require('../package.json').dependencies);

const config: webpack.Configuration = {
  entry: {
    app: CONSTANTS.APP_ENTRY,
    vendor: VENDOR_LIBS,
  },
  output: {
    filename: '[name].js',
    path: CONSTANTS.DOCS_DIR,
  },
  devtool: '#source-map',
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.json', '.ts', '.js', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
      }, {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                noEmit: false,
                declaration: false,
              },
            },
          },
        ],
      }, {
        test: /node_modules.*\.js$/,
        loader: 'source-map-loader',
      }, {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          }, {
            loader: 'css-loader',
          },
        ],
      }, {
        test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$|\.eot$/,
        loader: 'file-loader',
      }, {
        test: /\.less/,
        use: [
          {
            loader: 'style-loader',
          }, {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          }, {
            loader: 'less-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity,
    }),
    new HtmlWebpackPlugin({
      template: CONSTANTS.HTML_TEMPLATE,
      chunksSortMode: 'dependency',
    }),
  ],
};

export default config;

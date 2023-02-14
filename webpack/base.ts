import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { CONSTANTS } from './constants';

const config: webpack.Configuration = {
  entry: CONSTANTS.APP_ENTRY,
  output: {
    filename: '[name].js',
    path: CONSTANTS.DOCS_DIR,
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.json', '.ts', '.js', '.tsx'],
  },
  optimization: {
    moduleIds: 'named',
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
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
      },
      {
        test: /node_modules.*\.js$/,
        loader: 'source-map-loader',
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff2?$|\.ttf$|\.eot$/,
        type: 'asset/resource',
      },
      {
        test: /\.less/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'less-loader',
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: CONSTANTS.HTML_TEMPLATE,
    }),
  ],
};

// tslint:disable-next-line no-default-export
export default config;

 'use strict';
var path = require("path"), webpack = require("webpack");

// Terser v1 uses less  memory than v2
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  let config = {
    cache: true,
    devtool: 'inline-source-map',
    context: path.join(__dirname, "/src/client"),
    entry: {
      main: "./main",
      webworker: "./models/webworker"
    },
    output: {
      path: path.resolve(__dirname, "public/js/"),
      filename: "[name].js",
      chunkFilename: "[id].js",
      sourceMapFilename: "[name].map",
      publicPath: "/js/"
    },
    module: {
      rules: [
	{
          test: /bootstrap\/js\//,
          use: [
            {
              loader: 'imports-loader?jQuery=jquery'
            }
          ]
	},
	// required to write "require('./style.scss')"
	{
          test: /\.scss$/,
          use: [
	    {
	      loader: MiniCssExtractPlugin.loader,
	      options: {
	      }
	    },
	    "css-loader?sourceMap",
	    "sass-loader?sourceMap"
	  ],
          // fallback: "style-loader",
	},
	{
          test: /\.(png|gif)$/,
          use: [
            {
              loader: "url-loader?mimetype=image/[ext]"
            }
          ]
	},

	// Font packaging - Font Awesome and custom icons into
	// public/fonts. Bootstrap still pulls in the free
	// glyphicons halflings, but that should be omitted if
	// we can find the right knob.
	{
	  test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
	  use: [{
	    // query syntax new, options block may be deprecated
	    loader: 'file-loader?name=public/fonts/[name].[ext]'
	  }]
	},
	// required for react jsx
	{
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: "babel-loader",
          query: {
            presets: ['es2015', 'react']
          }
	},

	// required for GLSL support
	{ test: /\.glsl$/, loader: 'webpack-glsl-loader' }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx', '.scss'],
      alias: {
	underscore: "lodash",
      }
    },
    optimization: {
      minimize: false,
    },
    plugins: [
      new webpack.ProvidePlugin({
	"React": 'react',
	"_": "lodash",
	"$": "jquery",
	"jQuery": "jquery",
	"Backbone": "backbone",
	"THREE": "three",
	"FileSaver": "file-saver",
	"request": "superagent",
	"ReactDOM": "react-dom",
	"io": "socket.io-client"
      }),
      new MiniCssExtractPlugin({
	// Options similar to the same options in webpackOptions.output
	// all options are optional
	filename: '[name].css',
	chunkFilename: '[id].css',
	ignoreOrder: false, // Enable to remove warnings about conflicting order
      })
    ],
  };
  
  if (argv.mode === 'production') {
    config.optimization = {
      minimizer: [
	new TerserPlugin({
          exclude: ['require'],
	  terserOptions: {
	    compress: {
	      drop_console: true,
	    },
	  },
	}),
      ],
    };
  }
  return config;
}

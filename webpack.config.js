 'use strict';
var path = require("path"),
    webpack = require("webpack");

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// uglify now crashes on ES6 const values that  show upin
// packages.  Use terser instead
//const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// Terser v1 uses less  memory than v
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env) => {
  let rtn = {
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
          // in webpack 4, TerserPlugin uses more memory and crashes
//          minimize: false,
	  minimizer: [
	    new TerserPlugin({
              exclude: ['require'],
            }),
	    // new UglifyJsPlugin({
	    //   uglifyOptions: {
	    // 	compress: {
            //       drop_console: true,
	    // 	},
            //     exclude: ['require'],
	    //   },
            // }),
	  ],
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
    if (env === 'prod') {
        rtn.plugins.push(new webpack.DefinePlugin({
            'process.env': {

                'NODE_ENV': JSON.stringify('production'),
            }
        }));
      // rtn.plugins.push(new webpack.LoaderOptionsPlugin({
      // 	//minimize: true
      // }));
        // rtn.plugins.push(new webpack.optimize.UglifyJsPlugin({
        //     sourceMap: false,
        //     compress: {
        //         sequences: true,
        //         dead_code: true,
        //         conditionals: true,
        //         booleans: true,
        //         unused: true,
        //         if_return: true,
        //         warnings: false,
        //         join_vars: true,
        //         drop_console: true
        //     },
        //     mangle: {
        //         except: ['require']
        //     },
        //     output: {
        //         comments: false
        //     }
        // }));

    }
    return rtn;
}


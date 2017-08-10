'use strict';
var path = require("path"),
    webpack = require("webpack"),
    ExtractTextPlugin = require("extract-text-webpack-plugin");

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
                    use: ExtractTextPlugin.extract({
                        fallback: "style-loader",
                        use: ["css-loader?sourceMap", "sass-loader?sourceMap"]
                    })
                },
                {
                    test: /\.(png|gif)$/,
                    use: [
                        {
                            loader: "url-loader?mimetype=image/[ext]"
                        }
                    ]
                },
                // required for glyphicons
                {
                    test: /\.(eot|svg|ttf|woff|woff2)$/,
                    use: [
                        {
                            loader: 'file-loader?name=public/fonts/[name].[ext]'
                        }
                    ]
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
            })
            , new ExtractTextPlugin("[name].css")
        ],

    };
    if (env === 'prod') {
        rtn.plugins.push(new webpack.DefinePlugin({
            'process.env': {

                'NODE_ENV': JSON.stringify('production'),
            }
        }));
        rtn.plugins.push(new webpack.LoaderOptionsPlugin({ minimize: true }));
        rtn.plugins.push(new webpack.optimize.UglifyJsPlugin({
            sourceMap: false,
            compress: {
                sequences: true,
                dead_code: true,
                conditionals: true,
                booleans: true,
                unused: true,
                if_return: true,
                warnings: false,
                join_vars: true,
                drop_console: true
            },
            mangle: {
                except: ['require']
            },
            output: {
                comments: false
            }
        }));

    }
    return rtn;
}


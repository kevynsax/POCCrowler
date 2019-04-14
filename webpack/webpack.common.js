const webpack = require("webpack");
const path = require('path');

module.exports = {
    entry: {
        popup: path.join(__dirname, '../src/popup.ts'),
        options: path.join(__dirname, '../src/options.ts'),
        background: path.join(__dirname, '../src/background.ts'),
        contentGetStatistics: path.join(__dirname, '../src/contentGetStatistics.ts'),
        contentGetTableData: path.join(__dirname, '../src/contentGetTableData.ts'),
        contentGenerateSheet: path.join(__dirname, '../src/contentGenerateSheet.ts'),
        contentGenerateRawSheet: path.join(__dirname, '../src/contentGenerateRawSheet.ts'),
    },
    output: {
        path: path.join(__dirname, '../dist/js'),
        filename: '[name].js'
    },
    optimization: {
        splitChunks: {
            name: 'vendor',
            chunks: "initial"
        }
    },
    module: {
        rules: [
            {
              test: /\.css$/,
              use: ['css-loader'],
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    node: {
        fs: 'empty'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [
        // exclude locale files in moment
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ]
};

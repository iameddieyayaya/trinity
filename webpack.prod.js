const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const CompressionPlugin = require('compression-webpack-plugin');


module.exports = merge(common, {

    mode: 'production',
    devtool: 'source-map',
    performance: {
        hints: 'warning'
    },
       optimization: {
       namedModules: false,
       namedChunks: false,
       nodeEnv: 'production',
       flagIncludedChunks: true,
       occurrenceOrder: true,
       concatenateModules: true,
       splitChunks: {
         hidePathInfo: true,
         minSize: 30000,
         maxAsyncRequests: 5,
         maxInitialRequests: 3,
       },
       noEmitOnErrors: true,
       checkWasmTypes: true,
       minimize: true,
     },
    plugins: [
        new CompressionPlugin({
          filename: '[path].br[query]',
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg)$/,
          compressionOptions: {
            // zlib’s `level` option matches Brotli’s `BROTLI_PARAM_QUALITY` option.
            level: 11,
          },
          threshold: 10240,
          minRatio: 0.8,
          deleteOriginalAssets: false,
        }),
      ],
});
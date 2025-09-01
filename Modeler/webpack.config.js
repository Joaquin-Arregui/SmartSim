const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const isDevMode = mode === 'development';

  return {
    mode,
    entry: {
      // Si no tienes index.js, elimina esta línea
      // index: './example/src/index.js',
      modeler: './example/src/modeler.js',
      modelerResource: './example/src/modelerResource.js' // <-- RUTA CORRECTA
    },
    output: {
      filename: 'dist/[name].js',
      path: path.resolve(__dirname, 'example'), // genera example/dist/*
      clean: true
    },
    module: {
      rules: [
        { test: /\.bpmn$/, type: 'asset/source' },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env'] } }
        },
        { test: /\.json$/, type: 'json', parser: { parse: JSON.parse } },
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        { test: /\.less$/, use: ['style-loader', 'css-loader', 'less-loader'] },
        { test: /\.svg$/, use: 'raw-loader' }
      ]
    },
    resolve: {
      fallback: {
        fs: false,
        path: require.resolve('path-browserify'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/')
      }
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'bpmn-js/dist/assets', context: 'node_modules', to: 'example/dist/vendor/bpmn-js/assets' },
          { from: '@bpmn-io/properties-panel/dist/assets', context: 'node_modules', to: 'example/dist/vendor/bpmn-js-properties-panel/assets' }
        ]
      })
    ],
    devtool: isDevMode ? 'eval-source-map' : 'source-map',
    devServer: {
      static: path.join(__dirname, 'example'), // sirve los HTML desde Modeler/example
      compress: true,
      port: 9000,
      hot: true,
      open: true,
      liveReload: false
    }
  };
};

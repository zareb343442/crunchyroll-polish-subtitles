const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [
  // Background Service Worker
  {
    name: 'background',
    mode: 'production',
    entry: './src/background.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'background.js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
  },
  // Content Script
  {
    name: 'content-script',
    mode: 'production',
    entry: './src/content-script.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'content-script.js',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
  },
  // Subtitle Overlay
  {
    name: 'subtitle-overlay',
    mode: 'production',
    entry: './src/subtitle-overlay.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'subtitle-overlay.js',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.css'],
    },
  },
  // Popup UI
  {
    name: 'popup',
    mode: 'production',
    entry: './src/popup.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'popup.js',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
      }),
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.css'],
    },
  },
  // Copy static assets
  {
    name: 'copy-assets',
    mode: 'production',
    entry: {},
    output: {
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'assets', to: 'assets' },
          { from: 'manifest.json', to: 'manifest.json' },
        ],
      }),
    ],
  },
];

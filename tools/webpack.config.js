/* eslint-env node */

const ClosureCompiler = require("webpack-closure-compiler");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const webpack = require("webpack");

const RXP_ENV = process.env.RXP_ENV || "production";
const shouldMinify = !!process.env.RXP_MINIFY;
const isBarebone = process.env.RXP_BAREBONE === "true";

if (["development", "production"].indexOf(RXP_ENV) < 0) {
  throw new Error("unknown RXP_ENV " + RXP_ENV);
}

const isDevMode = RXP_ENV === "development";

module.exports = {
  mode: isDevMode ? "development" : "production",
  entry: "./src/exports.ts",
  output: {
    library: "RxPlayer",
    libraryTarget: "umd",
    filename: shouldMinify ? "rx-player.min.js" : "rx-player.js",
  },
  optimization: {
    minimizer: shouldMinify ? [
      new ClosureCompiler({
        options: {
          compilation_level: "SIMPLE",
          language_in: "ES5",
          warning_level: "VERBOSE",
        },
      }),
    ] : [],
  },
  performance: {
    maxEntrypointSize: shouldMinify ? 400000 : 1500000,
    maxAssetSize: shouldMinify ? 400000 : 1500000,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new webpack.DefinePlugin({
      "__FEATURES__": {
        SMOOTH: isBarebone ?
          process.env.RXP_SMOOTH === "true" :
          process.env.RXP_SMOOTH !== "false",

        DASH: isBarebone ?
          process.env.RXP_DASH === "true" :
          process.env.RXP_DASH !== "false",

        DIRECTFILE: isBarebone ?
          process.env.RXP_DIRECTFILE === "true" :
          process.env.RXP_DIRECTFILE !== "false",

        NATIVE_TTML: isBarebone ?
          process.env.RXP_NATIVE_TTML === "true" :
          process.env.RXP_NATIVE_TTML !== "false",

        NATIVE_SAMI: isBarebone ?
          process.env.RXP_NATIVE_SAMI === "true" :
          process.env.RXP_NATIVE_SAMI !== "false",

        NATIVE_VTT: isBarebone ?
          process.env.RXP_NATIVE_VTT === "true" :
          process.env.RXP_NATIVE_VTT !== "false",

        NATIVE_SRT: isBarebone ?
          process.env.RXP_NATIVE_SRT === "true" :
          process.env.RXP_NATIVE_SRT !== "false",

        HTML_TTML: isBarebone ?
          process.env.RXP_HTML_TTML === "true" :
          process.env.RXP_HTML_TTML !== "false",

        HTML_SAMI: isBarebone ?
          process.env.RXP_HTML_SAMI === "true" :
          process.env.RXP_HTML_SAMI !== "false",

        HTML_VTT: isBarebone ?
          process.env.RXP_HTML_VTT === "true" :
          process.env.RXP_HTML_VTT !== "false",

        HTML_SRT: isBarebone ?
          process.env.RXP_HTML_SRT === "true" :
          process.env.RXP_HTML_SRT !== "false",

        // TODO
        // EME: isBarebone ?
        //   process.env.RXP_EME === "true" :
        //   process.env.RXP_EME !== "false",
        // BIF: isBarebone ?
        //   process.env.RXP_BIF === "true" :
        //   process.env.RXP_BIF !== "false",
      },
      __DEV__: isDevMode,
      __LOGGER_LEVEL__: isDevMode ? "\"INFO\"" : "\"DEBUG\"",
      "process.env": {
        NODE_ENV: JSON.stringify(isDevMode ? "development" : "production"),
      },
    }),
  ],
  node: {
    console: false,
    global: true,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false,
    setImmediate: false,
  },
};

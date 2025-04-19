const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/index.ts",
  externals: [nodeExternals()],
  module: { rules: [{ test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ }] },
  output: { filename: "index.js", path: path.resolve(__dirname, "dist") },
  resolve: {
    alias: { "@root": path.resolve(__dirname, "src/") },
    extensions: [".tsx", ".ts", ".js"],
  },
  target: "node",
};

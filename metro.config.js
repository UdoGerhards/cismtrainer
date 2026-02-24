const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  allowedOrigins: ["https://web.localhost"],
};

module.exports = config;

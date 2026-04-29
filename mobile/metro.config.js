// Metro config for Expo with package.json `exports` field enabled.
// Required by @clerk/clerk-expo (and most modern ESM-only npm packages).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

module.exports = config;

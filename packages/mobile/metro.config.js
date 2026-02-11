const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Add monorepo watch folders for pnpm workspace
config.watchFolders = [
  workspaceRoot,
];

// Ensure proper module resolution for hoisted dependencies
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add extraNodeModules to help resolve packages from root
const rootNodeModules = path.resolve(workspaceRoot, 'node_modules');
if (fs.existsSync(rootNodeModules)) {
  config.resolver.extraNodeModules = {};
  fs.readdirSync(rootNodeModules).forEach((moduleName) => {
    config.resolver.extraNodeModules[moduleName] = path.resolve(rootNodeModules, moduleName);
  });
}

// Add source extensions for proper resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

module.exports = config;

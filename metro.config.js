const fs = require('fs');
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

function tryResolveRelativeWithExtensions(originModulePath, moduleName, platform) {
  if (!moduleName.startsWith('.')) {
    return null;
  }

  const base = path.resolve(path.dirname(originModulePath), moduleName);
  const candidates = [];

  if (platform === 'android') {
    candidates.push(`${base}.android.js`, `${base}.native.js`);
  } else if (platform === 'ios') {
    candidates.push(`${base}.ios.js`, `${base}.native.js`);
  } else if (platform === 'web') {
    candidates.push(`${base}.web.js`);
  } else {
    candidates.push(`${base}.native.js`);
  }

  candidates.push(base, `${base}.js`, `${base}.ts`, `${base}.tsx`, `${base}.jsx`);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { type: 'sourceFile', filePath: candidate };
    }
  }

  return null;
}

function shouldPatchRelativeImports(originModulePath) {
  return originModulePath.includes(`${path.sep}react-native-blob-util${path.sep}`);
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('.') && shouldPatchRelativeImports(context.originModulePath)) {
    const resolved = tryResolveRelativeWithExtensions(
      context.originModulePath,
      moduleName,
      platform,
    );
    if (resolved) {
      return resolved;
    }
  }

  if (defaultResolveRequest) {
    const result = defaultResolveRequest(context, moduleName, platform);
    if (result != null) {
      return result;
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

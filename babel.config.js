module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // Remove console.log statements in production builds
  // Only check NODE_ENV (reliable) - EXPO_PUBLIC_ENV is build-time only
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
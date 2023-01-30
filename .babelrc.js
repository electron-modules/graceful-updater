'use strict';

module.exports = {
  presets: [
    'next/babel'
  ],
  plugins: [
    [
      'module-resolver',
      {
        'alias': {
          '@': './src'
        }
      }
    ]
  ]
};

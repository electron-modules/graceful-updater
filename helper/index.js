'use strict';

const path = require('path');

const basePath = path.join(
  process.execPath,
  '..',
  'resources',
  'app.asar.unpacked',
  'node_modules',
  'graceful-updater',
  'node_modules',
  'graceful-updater-windows-helper'
);

exports.unzipExeFilePath = path.join(basePath, 'unzip.exe');
exports.installerExeFilePath = path.join(basePath, 'installer.exe');

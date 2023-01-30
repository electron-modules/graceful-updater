'use strict';

import _ from 'lodash';
import mm from 'mm';

const ipcEventMap = {} as any;

(global as any).mock = mm;
(global as any).assert = require('assert');

(global as any).mockElectron = {
  app: {
    getPath: (d: any) => d,
    exit: () => {},
    relaunch: () => {},
  },
  logger: {
    info: () => {},
    warn: () => {},
  },
  dialog: {
    showMessageBoxSync: () => {
      return true;
    },
  },
  // mock ipc
  ipcMain: {
    handle(eventName: any, callback: any) {
      ipcEventMap[eventName] = callback;
    },
    on(eventName: any, callback: any) {
      ipcEventMap[eventName] = callback;
    },
    async mockEvent(eventName: any, options: any) {
      const fun = ipcEventMap[eventName];
      return await fun(null, options);
    },
  },
  shell: {
    openItem: () => {},
    openExternal: () => {},
  },
  nativeTheme: {
    on: () => {},
  },
};

beforeEach(async () => {});

afterEach(async () => {
  mm.restore();
});

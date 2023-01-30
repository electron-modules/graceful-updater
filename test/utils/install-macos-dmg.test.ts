'use strict';

mockRequire = require('mock-require');
let installMacOSDmg = require('../../src/utils/install-macos-dmg').default;

const mock = (global as any).mock;
const assert = (global as any).assert;

const app = {
  productName: 'ElectronUpdator',
  logger: {
    info: () => {},
    warn: () => {},
  },
  availableUpdate: {
    latestVersion: '0.2.20',
    latestDmgPath: 'ElectronUpdator.dmg',
  },
  storage: {
    get: () => {},
  },
};

function generateMockSpawn() {
  let index = 0;
  let responseArray = [] as any;

  let existsSyncIndex = 0;
  let existsSyncResponseArray = [] as any;

  mockRequire('src/utils/index', {
    existsSync: () => {
      const result = existsSyncResponseArray[existsSyncIndex];
      existsSyncIndex++;
      return result;
    },
    spawnAsync: () => {
      return new Promise((resolve, reject) => {
        const { err, success = '' } = responseArray[index];
        index++;
        if (err) {
          return reject(err);
        }
        resolve(success);
      });
    },
  });

  return {
    setExistsSyncReturn: (array: any) => {
      existsSyncResponseArray = array;
    },
    setReturn: (array: any) => {
      responseArray = array;
    },
  };
}

describe('test/utils/install-macos-dmg.test.ts', () => {
  let mockSpawn: any;

  beforeEach(() => {
    mockSpawn = generateMockSpawn();
    installMacOSDmg = mockRequire.reRequire('../../src/utils/install-macos-dmg').default;
  });

  afterEach(() => {
    mockRequire.stopAll();
  });

  it('step1 fail', async () => {
    mockSpawn.setReturn([
      {
        success: 'not found',
      },
    ]);
    const installStatus = await installMacOSDmg(app);

    assert.equal(installStatus.success, false);
    assert.equal(installStatus.type, 'dmg-install-failed');
  });

  it('step3 fail', async () => {
    mockSpawn.setReturn([
      {
        success: '/bin/hdiutil',
      },
      {
        success: '',
      },
      {
        err: 'error',
      },
    ]);
    mockSpawn.setExistsSyncReturn([false, false]);
    const installStatus = await installMacOSDmg(app);
    assert.equal(installStatus.success, false);
  });

  it('step4 fail', async () => {
    mockSpawn.setReturn([
      {
        success: '/bin/hdiutil',
      },
      {
        success: '',
      },
      {
        success: '',
      },
      {
        err: 'error',
      },
    ]);
    mockSpawn.setExistsSyncReturn([false, true, false]);
    const installStatus = await installMacOSDmg(app);
    assert.equal(installStatus.success, false);
  });

  it('step5 fail', async () => {
    mockSpawn.setReturn([
      {
        success: '/bin/hdiutil',
      },
      {
        success: '',
      },
      {
        success: '',
      },
      {
        success: '',
      },
      {
        err: 'error',
      },
      {
        success: '',
      },
    ]);
    mockSpawn.setExistsSyncReturn([false, true, true, false]);
    const installStatus = await installMacOSDmg(app);
    assert.equal(installStatus.success, false);
  });

  it('test all success', async () => {
    mockSpawn.setReturn([
      {
        success: '/bin/hdiutil',
      },
      {
        success: '',
      },
      {
        success: '',
      },
      {
        success: '',
      },
      {
        success: '',
      },
      {
        success: '',
      },
    ]);
    mockSpawn.setExistsSyncReturn([false, true, true, true]);
    const installStatus = await installMacOSDmg(app);
    assert.equal(installStatus.success, true);
  });
});

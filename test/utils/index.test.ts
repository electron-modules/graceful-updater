'use strict';

let mockRequire = require('mock-require');

function generateMockUrllib() {
  let response = [] as any;
  let lastRequestOptions = null as any;

  mockRequire('urllib', {
    request: (_url: string, options: any) => {
      lastRequestOptions = options;
      return response;
    },
  });

  return {
    setReturn: (array: any) => {
      response = array;
    },
    getLastRequestOptions: () => lastRequestOptions,
  };
}
const mockUrllib = generateMockUrllib();
const { getMacOSAppPath, requestUpdateInfo } = require('../../src/utils/index');
const mock = (global as any).mock;
const assert = (global as any).assert;
const path = require('path');

const { sep } = path;
describe('test/utils/index.test.ts', () => {
  afterEach(() => {
    mockRequire.stopAll();
  });
  describe('getMacOSAppPath()', () => {
    it('ElectronUpdator安装在 Applications 下', () => {
      const execPath = ['', 'Applications', 'ElectronUpdator.app', 'Contents', 'MacOS', 'ElectronUpdator'].join(sep);
      mock(process, 'execPath', execPath);
      const result = getMacOSAppPath();
      assert.equal(result, ['', 'Applications', 'ElectronUpdator.app'].join(sep));
    });

    it('ElectronUpdator安装在 Applications/XX 目录下 ', () => {
      const execPath = ['', 'Applications', 'Test', 'ElectronUpdator.app', 'Contents', 'MacOS', 'ElectronUpdator'].join(sep);
      mock(process, 'execPath', execPath);
      const result = getMacOSAppPath();
      assert.equal(result, ['', 'Applications', 'Test', 'ElectronUpdator.app'].join(sep));
    });
  });

  describe('requestUpdateInfo()', () => {
    it('参数异常', async () => {
      let isError = false;

      try {
        await requestUpdateInfo(null as any);
      } catch (e) {
        isError = true;
      }

      assert.equal(isError, true);
    });

    it('需要格式化', async () => {
      let updator = {
        url: 'https://github.com',
        responseFormatter: () => {
          return {
            isUpdate: true,
            version: '2.2.2',
          };
        },
      };

      mockUrllib.setReturn({
        status: 200,
        data: {
          isUpdate: true,
          version: '7.2.2',
        },
      });

      const result = await requestUpdateInfo(updator as any);
      assert.equal(result.version, '2.2.2');
    });
    it('不需要格式化', async () => {
      let updator = {
        url: 'https://github.com',
      };
      mockUrllib.setReturn({
        status: 200,
        data: {
          isUpdate: true,
          version: '7.2.2',
        },
      });
      const result = await requestUpdateInfo(updator);
      assert.equal(result.version, '7.2.2');
    });

    it('应将 headers 透传给 urllib.request', async () => {
      const headers = { Cookie: 'session=abc123; token=xyz' };
      const updator = {
        url: 'https://github.com',
        headers,
      };
      mockUrllib.setReturn({
        status: 200,
        data: {
          isUpdate: true,
          version: '1.0.0',
        },
      });
      await requestUpdateInfo(updator);
      const requestOptions = mockUrllib.getLastRequestOptions();
      assert.deepEqual(requestOptions.headers, headers);
    });

    it('未传 headers 时不影响请求', async () => {
      const updator = {
        url: 'https://github.com',
      };
      mockUrllib.setReturn({
        status: 200,
        data: {
          isUpdate: true,
          version: '1.0.0',
        },
      });
      await requestUpdateInfo(updator);
      const requestOptions = mockUrllib.getLastRequestOptions();
      assert.equal(requestOptions.headers, undefined);
    });
  });
});

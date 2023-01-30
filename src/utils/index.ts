import path from 'path';
import { spawn, exec } from 'child_process';
import util from 'util';
import urllib from 'urllib';
import sudoPrompt from 'sudo-prompt-alt';
import rimraf from 'rimraf-alt';
import { rename, exists, readdir, existsSync, createWriteStream } from 'original-fs';
import { IUpdateInfo, IAppUpdatorOptions } from '@/common/types';
import { OldArchivePrefix } from '@/common/constants';

export const renameAsync = util.promisify(rename);
export const existsAsync = util.promisify(exists);
export const readdirAsync = util.promisify(readdir);
export const rimrafAsync = util.promisify(rimraf);
export const execAsync = util.promisify(exec);
export const isWin = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export { createWriteStream, existsSync, sudoPrompt };

export const getMacOSAppPath = () => {
  const sep = path.sep;
  const execPath = process.execPath;
  const contentPath = [ '', 'Contents', 'MacOS' ].join(sep);
  return execPath.split(contentPath)[0];
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitUntil = async (handle: Function, options = { retryTime: 10, ms: 1000 }) => {
  let retryTime = 0;
  const p: any = async () => {
    const isOk = handle();
    if (!isOk) {
      if (retryTime === options.retryTime) {
        return false;
      }
      retryTime++;
      await sleep(options.ms);
      return await p();
    }
    return true;
  };
  return await p();
};

export const spawnAsync = (command: string, options: any) => {
  let stdout = '';
  let stderr = '';
  const child = spawn(command, options) as any;
  child.stdout.on('data', (data: any) => {
    stdout += data;
  });
  child.stderr.on('data', (data: any) => {
    stderr += data;
  });
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code: number) => {
      if (code === 0) {
        return resolve(stdout.toString());
      }
      const err = new Error(`child exited with code ${code}`) as any;
      err.code = code;
      err.stderr = stderr.toString();
      reject(err);
    });
  });
};

export const cleanOldArchive = async (resourcePath: string) => {
  const resourceArray = await readdirAsync(resourcePath);
  if (!resourceArray || !resourceArray.length) {
    return;
  }
  const oldArchiveSource = resourceArray.filter((item: string) => item.startsWith(OldArchivePrefix));
  return await Promise.all(
    oldArchiveSource.map(async (file: string) => {
      const filePath = path.join(resourcePath, file);
      if (await existsAsync(filePath)) {
        await rimrafAsync(filePath);
      }
    }),
  );
};

export const existFile = async (path: string): Promise<boolean> => {
  const _existFile = await waitUntil(() => existsSync(path), {
    ms: 1000,
    retryTime: 30,
  });
  return _existFile;
};

export const requestUpdateInfo = async (options: IAppUpdatorOptions): Promise<IUpdateInfo> => {
  const { url } = options;
  if (!url) {
    throw new Error('request url can\'t be empty');
  }

  let res: any = null;
  try {
    res = await urllib.request(url, {
      dataType: 'json',
      timeout: 10 * 1000,
    });
  } catch (e) {
    throw e;
  }
  if (!res || res.status !== 200) {
    throw new Error(`request failure,status is ${res.status}`);
  }
  return res.data;
};

export const getExecuteFile = (file: string) => {
  return path.join(__dirname, '..', 'libs', file);
};

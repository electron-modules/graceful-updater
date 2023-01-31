import os from 'os';
import path from 'path';
import { waitUntil, getMacOSAppPath } from '.';
import {
  IInstallResult, IAppUpdatorOptions,
  IUpdateInfo, ILogger, IAvailableUpdate,
} from '@/common/types';
import { spawnAsync, existsSync } from './index';

const _log = (logger: ILogger, e: any) => {
  const message = (e.stack || e).toString();
  logger.error?.(message);
};

export default async (
  updatorOptions: IAppUpdatorOptions,
  logger: ILogger,
  availableUpdate: IAvailableUpdate,
  updateInfo: IUpdateInfo,
  preCheck = false,
): Promise<IInstallResult> => {
  const { productName } = updatorOptions || {};
  const { downloadTargetDir } = availableUpdate || {};
  const appPath = getMacOSAppPath();
  const tmpPath = path.join(os.tmpdir(), String(new Date().getTime())); // 本地临时文件使用的目录
  const volumesPath = path.join(
    '/Volumes',
    updatorOptions.dmgTitleFormatter ? updatorOptions.dmgTitleFormatter(updatorOptions, updateInfo) : (productName as string),
  );
  const volumesAppPath = path.join(volumesPath, `${productName}.app`);

  // step 1: 检测是否支持 hdiutil;
  try {
    const res = (await spawnAsync('which', [ 'hdiutil' ])) as string;
    if (!res.includes('/bin/hdiutil')) {
      throw new Error('hdiutil not found');
    }
  } catch (error) {
    if (preCheck) {
      _log(logger, error);
    }
    return {
      success: false,
      error,
    };
  }

  // step 2: eject 一次 volume 下的 app，兜底，避免上一次结束时执行失败
  try {
    await spawnAsync('hdiutil', [ 'eject', volumesPath ]);
  } catch (e) {
    // 如果前一次更新时 eject 成功，这里文件不存在会报错，是个正常的 case，不用处理上报
  } finally {
    const volumeAppNotExist = await waitUntil(() => !existsSync(volumesAppPath), {
      ms: 300,
      retryTime: 5,
    });
    if (!volumeAppNotExist) {
      const error = new Error('volume not exists');
      if (preCheck) {
        _log(logger, error);
      }
      return {
        // eslint-disable-line
        success: false,
        error,
      };
    }
  }
  // step 3: 执行 hdiutil attach，挂载 dmg
  try {
    await spawnAsync('hdiutil', [ 'attach', downloadTargetDir ]);
  } catch (error) {
    _log(logger, error);
  } finally {
    // 判断有没有新的 dmg 文件，没有的话提示用户重新下载
    const volumeAppExist = await waitUntil(() => existsSync(volumesAppPath), {
      ms: 300,
      retryTime: 5,
    });
    if (!volumeAppExist) {
      const error = new Error('attach fail');
      if (preCheck) {
        _log(logger, error);
      }
      return {
        // eslint-disable-line
        success: false,
        error,
      };
    }
  }

  if (preCheck) {
    // 如果是预检查，直接返回
    try {
      await spawnAsync('hdiutil', [ 'eject', volumesPath ]);
    } catch (error) {
      _log(logger, error);
    }

    return {
      success: true,
    };
  }

  // step 4: 将当前目录下的 app 移到临时目录，如果后续操作失败了兜底用
  try {
    await spawnAsync('mv', [ appPath, tmpPath ]);
  } catch (error) {
    error.customMessage = 'step4 mv to tmp path error';
    _log(logger, error);
  } finally {
    // 看临时目录文件是否移动成功
    const tmpPathExist = await waitUntil(() => existsSync(tmpPath), {
      ms: 300,
      retryTime: 5,
    });
    if (!tmpPathExist) {
      const error = new Error('cp to tmp path fail');
      return {
        // eslint-disable-line
        success: false,
        error,
      };
    }
  }

  // step 5: 将新的 app 文件移动到 Applications 目录下，如果失败 or 查不到移入文件，将临时目录下的文件移动回来
  try {
    await spawnAsync('cp', [ '-R', volumesAppPath, appPath ]);
  } catch (error) {
    _log(logger, error);
  } finally {
    const appExist = await waitUntil(() => existsSync(appPath), {
      ms: 300,
      retryTime: 5,
    });
    // 查不到新移入的 dmg，将原 dmg 再移动回来
    if (!appExist) {
      const error = new Error('cp to app fail');
      await spawnAsync('mv', [ tmpPath, appPath ]);
      return {
        // eslint-disable-line
        success: false,
        error,
      };
    }
  }

  // step 6: 执行 hdiutil eject，推出
  try {
    await spawnAsync('hdiutil', [ 'eject', volumesPath ]);
  } catch (error) {
    _log(logger, error);
  }

  return {
    success: true,
  };
};

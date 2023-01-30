import path from 'path';
import { AppUpdator } from '@/app-updator';
import {
  IInstallResult,
  IUpdateInfo,
  IAvailableUpdate,
  IAppUpdatorOptions,
} from '@/common/types';
import { EventType, OldArchivePrefix, UpdateType } from '@/common/constants';
import installMacosDmg from '@/utils/install-macos-dmg';
import { execAsync, existsAsync, renameAsync } from '@/utils';

export class MacUpdator extends AppUpdator {
  constructor(options: IAppUpdatorOptions) {
    super(options);
  }

  protected override doGetAvailableUpdateInfo(updateInfo: IUpdateInfo): IAvailableUpdate {
    this.logger.info('MacUpdator#doGetAvailableUpdateInfo:start');
    const exePath = this.app.exePath;
    const resourcePath = path.resolve(exePath, '..', '..', 'Resources');
    const latestAsarPath = path.resolve(resourcePath, 'latest.asar');
    const latestAppPath = path.resolve(resourcePath, 'latest');
    let downloadTargetDir = `${latestAsarPath}.zip`;
    if (updateInfo.updateType === UpdateType.Package) {
      downloadTargetDir = `${latestAppPath}.dmg`;
    }
    return {
      resourcePath,
      downloadTargetDir,
      latestAsarPath,
    };
  }

  protected override async doPreCheckForPackage(): Promise<IInstallResult> {
    this.logger.info('MacUpdator#doPreCheckForPackage:start');
    // Mac 全量安装前，先进行 dmg 安装检查
    return await installMacosDmg(
      this.options as IAppUpdatorOptions,
      this.logger,
      this.availableUpdate,
      this.updateInfo as IUpdateInfo,
      true,
    );
  }

  /**
   * 资源解压
   * @return
   */
  protected override async doUnzip(): Promise<IInstallResult> {
    this.logger.info('MacUpdator#doUnzip:start');
    const { resourcePath, downloadTargetDir } = this.availableUpdate;
    try {
      // 直接解压
      await execAsync(`unzip -o ${downloadTargetDir}`, {
        cwd: resourcePath,
        maxBuffer: 2 ** 28,
      });
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
  }

  protected override async doQuitAndInstallAsar(): Promise<IInstallResult> {
    this.logger.info('MacUpdator#doQuitAndInstallAsar:start');
    if (!this.availableUpdate) {
      this.logger.error('MacUpdator#doQuitAndInstallAsar:not availableUpdate');
      return Promise.resolve({ success: false });
    }
    const { resourcePath, latestAsarPath } = this.availableUpdate;
    const oldAsarPath = path.resolve(resourcePath, `${OldArchivePrefix}${new Date().getTime()}.asar`);
    const currentAsarPath = path.resolve(resourcePath, 'app.asar');
    try {
      // 将老包改名 app.asar => old-xxxx.asar
      if (await existsAsync(currentAsarPath)) {
        await renameAsync(currentAsarPath, oldAsarPath);
      }
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
    try {
      // 新包替换
      await renameAsync(latestAsarPath, currentAsarPath);
    } catch (error) {
      // 替换出错，需要把老包还原
      await renameAsync(oldAsarPath, currentAsarPath);
      return {
        success: false,
        error,
      };
    }
    this.logger.warn('AppUpdator#quitAndInstall:install success');
    this.emit(EventType.BEFORE_QUIT_FOR_UPDATE);
    // 重启应用
    this.app.relaunch();
    return {
      success: true,
    };
  }

  protected override async doQuitAndInstallPackage() {
    this.logger.info('AppUpdator#doQuitAndInstallPackage:start');
    return await installMacosDmg(
      this.options as IAppUpdatorOptions,
      this.logger,
      this.availableUpdate,
      this.updateInfo as IUpdateInfo,
    );
  }
}

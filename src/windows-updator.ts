import path from 'path';
import { shell } from 'electron';
import {
  IInstallResult,
  IUpdateInfo,
  IAvailableUpdate,
  IAppUpdatorOptions,
} from '@/common/types';
import { UpdateType } from '@/common/constants';
import { sudoPromptExec } from '@/utils/sudo-prompt-exec';
import { AppUpdator } from '@/app-updator';
import { execAsync, getExecuteFile } from '@/utils';

export class WindowsUpdator extends AppUpdator {
  protected override doGetAvailableUpdateInfo(updateInfo: IUpdateInfo): IAvailableUpdate {
    this.logger.info('WindowsUpdator#doGetAvailableUpdateInfo:start');
    let resourcePath = path.resolve(this.app.userDataPath);
    const latestAsarPath = path.resolve(resourcePath, 'latest.asar');
    const latestAppPath = path.resolve(resourcePath, 'latest');
    let downloadTargetDir = `${latestAsarPath}.zip`;
    if (updateInfo.updateType === UpdateType.Package) {
      downloadTargetDir = `${latestAppPath}.exe`;
    }
    return {
      resourcePath,
      downloadTargetDir,
      latestAsarPath,
    };
  }

  protected override async doPreCheckForPackage(): Promise<IInstallResult> {
    this.logger.info('WindowsUpdator#doPreCheckForPackage:start');
    // Windows 全量安装默认预检正常
    return Promise.resolve({ success: true });
  }

  protected override async doUnzip(): Promise<IInstallResult> {
    this.logger.info('WindowsUpdator#doUnzip:start');
    try {
      const { downloadTargetDir, resourcePath } = this.availableUpdate;
      const unzipExe = getExecuteFile('unzip.exe');
      const executeCommand = `"${unzipExe}" -o "${downloadTargetDir}" -d "${resourcePath}"`;
      await execAsync(executeCommand);
    } catch (error) {
      return {
        success: false,
        error,
      };
    }
    this.logger.info('WindowsUpdator#doUnzip:success');
    return {
      success: true,
    };
  }

  protected override async doQuitAndInstallPackage(): Promise<IInstallResult> {
    this.logger.info('WindowsUpdator#doQuitAndInstallPackage:success');
    const { downloadTargetDir } = this.availableUpdate;
    try {
      // Windows 全量安装
      const shellOpen = (shell as any).openItem || shell.openPath;
      shellOpen(downloadTargetDir);
      setTimeout(() => {
        this.app.exit(0);
      }, 30);
      return Promise.resolve({ success: true });
    } catch (error) {
      return Promise.resolve({ success: false, error });
    }
  }

  protected override async doQuitAndInstallAsar(): Promise<IInstallResult> {
    this.logger.info('WindowsUpdator#doQuitAndInstallAsar:start');
    const productName = this.options?.productName;
    const { resourcePath } = this.availableUpdate;
    const exePath = this.app.exePath;
    const updateExePath = getExecuteFile('installer.exe');
    const targetPath = path.resolve(exePath, '..', 'resources');
    const executeCommand = `"${updateExePath}" "${targetPath}" "${resourcePath}" "${productName}.exe" "${exePath}"`;
    try {
      await sudoPromptExec(this.options as IAppUpdatorOptions, this.logger, executeCommand);
      this.logger.warn('AppUpdator#quitAndInstall:install success');
      this.emit(EventType.BEFORE_QUIT_FOR_UPDATE);
      return Promise.resolve({ success: true });
    } catch (error) {
      return Promise.resolve({ success: false, error });
    }
  }
}

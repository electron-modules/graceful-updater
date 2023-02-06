import path from 'path';
import { shell } from 'electron';
import { IInstallResult, IUpdateInfo, IAvailableUpdate } from '@/common/types';
import { UpdateType, FileName } from '@/common/constants';
import { sudoPromptExec } from '@/utils/sudo-prompt-exec';
import { AppUpdator } from '@/app-updator';
import { execAsync, getExecuteFile, renameAsync } from '@/utils';

export class WindowsUpdator extends AppUpdator {
  protected override doGetAvailableUpdateInfo(updateInfo: IUpdateInfo): IAvailableUpdate {
    this.logger.info('WindowsUpdator#doGetAvailableUpdateInfo:start');
    const resourcePath = path.resolve(this.app.userDataPath);
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
    const { downloadTargetDir, resourcePath, latestAsarPath } = this.availableUpdate;
    try {

      const zipInfo = await execAsync(`unzip -Z -1 ${downloadTargetDir}`, {
        cwd: resourcePath,
        maxBuffer: 2 ** 28,
      });
      const fileName = zipInfo?.stdout?.trim();
      if (fileName !== FileName.RUNTIME_APP_ASAR) {
        const currentAsarPath = path.join(resourcePath, fileName);
        await renameAsync(currentAsarPath, latestAsarPath);
      }

      const unzipExe = getExecuteFile(this._windowHelperExeDir, 'unzip.exe');
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
      this.logger.warn('WindowsUpdator#quitAndInstall:install success');
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
    const updateExePath = getExecuteFile(this._windowHelperExeDir, 'installer.exe');
    const targetPath = path.resolve(exePath, '..', 'resources');
    const executeCommand = `"${updateExePath}" "${targetPath}" "${resourcePath}" "${productName}.exe" "${exePath}"`;
    try {
      await sudoPromptExec(this.logger, executeCommand);
      this.logger.warn('WindowsUpdator#quitAndInstall:install success');
      return Promise.resolve({ success: true });
    } catch (error) {
      return Promise.resolve({ success: false, error });
    }
  }
}

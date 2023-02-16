import { EventEmitter } from 'eventemitter3';
import { nanoid } from 'nanoid';
import path from 'path';
import {
  ILogger,
  IInstallResult,
  IAppUpdatorOptions,
  IUpdateInfo,
  IAvailableUpdate,
  IAppAdapter,
  IDownloadFileOptions,
} from '@/common/types';
import { InstallResultType, StateType, ExecuteType, UpdateType, EventType } from '@/common/constants';
import { downloadFile } from '@/utils/download-file';
import { cleanOldArchive, existFile, existsAsync, requestUpdateInfo } from '@/utils';
import { ElectronAppAdapter } from '@/elelctron-app-adapter';

const DEFAULT_EXEFILE_DIR = path.join(__dirname, '..', 'helper');

export abstract class AppUpdator extends EventEmitter {
  private state: StateType = StateType.Idle;
  public updateInfo?: IUpdateInfo | undefined;
  public logger: ILogger;
  public availableUpdate: IAvailableUpdate;
  public options?: IAppUpdatorOptions;
  public startUuid: string;
  protected _windowHelperExeDir: string;
  protected readonly app: IAppAdapter;

  constructor(options: IAppUpdatorOptions, app?: IAppAdapter) {
    super();
    this.options = options;
    this._windowHelperExeDir = this.options?.getWindowsHelperExeDir?.() || DEFAULT_EXEFILE_DIR;
    this.logger = this._wrapLogger(options.logger as ILogger);
    this.app = app || new ElectronAppAdapter();
    this.startUuid = this._getStartUuid();
    this.logger.info('constructor');
    this.availableUpdate = {
      resourcePath: '',
      latestAsarPath: '',
      downloadTargetDir: '',
    };
  }
  _getStartUuid() {
    return `${nanoid(16)}${Date.now()}`;
  }

  _wrapLogger(logger: ILogger) {
    if (!logger) {
      logger = console as ILogger;
    }
    const _logger = { ...logger };

    const _wrap = (message: string, args: any[], callback: (...args: any[]) => any) => {
      callback(`[ElectronUpdator][${this.startUuid}][${this.state}]#${message}`, ...args);
    };

    _logger.error = (message: string, ...args: any[]) => {
      _wrap(message, args, logger.error);
    };
    _logger.info = (message: string, ...args: any[]) => {
      _wrap(message, args, logger.info);
    };
    _logger.warn = (message: string, ...args: any[]) => {
      _wrap(message, args, logger.warn);
    };

    return _logger;
  }

  private setState(state: StateType): void {
    this.logger.info(`setState:${state}`);
    this.state = state;
  }

  public setFeedUrl(url: string) {
    this.logger.info(`setFeedUrl:url is ${url}`);
    if (url && this.options) {
      this.options.url = url;
    }
  }

  public async checkForUpdates(executeType: ExecuteType = ExecuteType.Auto): Promise<void> {
    this.logger.info(`checkForUpdates:state is ${this.state},executeType is ${executeType}`);
    this.setState(StateType.Idle);
    try {
      // 新一轮更新流程，更新 startUuid
      this.startUuid = this._getStartUuid();
      this.setState(StateType.CheckingForUpdate);
      this.emit(EventType.CHECKING_FOR_UPDATE);
      const updateInfoResponse = await requestUpdateInfo(this.options as IAppUpdatorOptions);
      this.updateInfo = (
        this.options?.updateInfoFormatter ? (await this.options?.updateInfoFormatter(updateInfoResponse)) : updateInfoResponse
      ) as IUpdateInfo;

      const ifNeedUpdate = await this.options?.ifNeedUpdate(updateInfoResponse);
      if (!ifNeedUpdate) {
        this.logger.info(`checkForUpdates:updateInfo is ${JSON.stringify(this.updateInfo)},ifNeedUpdate is false`);
        this.emit(EventType.UPDATE_NOT_AVAILABLE, {
          updateInfo: this.updateInfo,
          executeType,
        });
        this.setState(StateType.Idle);
        return;
      }
      this.logger.info('checkForUpdates:ifNeedUpdate is true');
      this.availableUpdate = this.doGetAvailableUpdateInfo(this.updateInfo);

      if (!this.options?.autoDownload || executeType === ExecuteType.User) {
        this.logger.info('checkForUpdates:emit UPDATE_AVAILABLE');
        this.emit(EventType.UPDATE_AVAILABLE, {
          updateInfo: this.updateInfo,
          executeType,
        });
        return;
      }

      this.downloadUpdate(executeType);
    } catch (e) {
      e.customMessage = e.customMessage ? e.customMessage : `${InstallResultType.CheckForUpdatesError}_${e.message}`;
      this.logError(e);
      this.setState(StateType.Idle);
      this.emit(EventType.UPDATE_NOT_AVAILABLE, {
        updateInfo: this.updateInfo,
        executeType,
      });
    }
  }

  async downloadUpdate(executeType: ExecuteType = ExecuteType.User) {
    this.logger.info(`downloadUpdate:executeType is ${executeType}`);
    await this.downloadUpdateFile(this.updateInfo as IUpdateInfo, executeType);
    const result = await this.preCheck(executeType);
    if (result.success) {
      this.logger.info('downloadUpdate:emit UPDATE_DOWNLOADED');
      this.emit(EventType.UPDATE_DOWNLOADED, {
        executeType,
      });
    } else {
      this.dispatchError(result.error);
    }
  }

  public async quitAndInstall() {
    this.logger.info(`quitAndInstall:state is ${this.state}`);
    if (this.state !== StateType.Downloaded) {
      this.downloadUpdate();
      return;
    }
    this.setState(StateType.Idle);
    try {
      let result = { success: false } as IInstallResult;
      this.emit(EventType.BEFORE_QUIT_FOR_UPDATE);
      if (this.updateInfo?.updateType === UpdateType.Package) {
        result = await this.doQuitAndInstallPackage();
      } else {
        result = await this.doQuitAndInstallAsar();
      }
      if (!result.success) {
        result.message = `error: ${result.error?.message}`;
        this.dispatchError(result.error as Error);
      }
    } catch (e) {
      this.dispatchError(e);
    }
  }

  protected async preCheckForAsar(): Promise<IInstallResult> {
    this.logger.info('preCheckForAsar');
    return await this.unzip();
  }

  protected async preCheck(executeType: ExecuteType) {
    this.logger.info('preCheck');
    const { resourcePath } = this.availableUpdate;

    if (this.state !== StateType.Downloaded) {
      return {
        success: false,
        error: new Error(`preCheck:update status(${this.state}) error`),
      };
    }

    // 清理老包
    try {
      this.logger.info('preCheck:cleanOldArchive');
      await cleanOldArchive(resourcePath);
    } catch (e) {
      this.logError(e);
    }

    let result: IInstallResult = { success: true };
    const { downloadTargetDir } = this.availableUpdate;
    try {
      const hasLatestFile = await existsAsync(downloadTargetDir);
      // 下载失败返回提示
      if (!hasLatestFile) {
        return {
          success: false,
          error: new Error('file is notfound'),
        };
      }
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }

    if (this.updateInfo?.updateType === UpdateType.Package) {
      if (executeType === ExecuteType.Auto) {
        // 自动安装时，才进行预检查，提升安装效率
        result = await this.doPreCheckForPackage();
      }
    } else {
      result = await this.preCheckForAsar();
    }
    return result;
  }

  protected async downloadUpdateFile(updateInfo: IUpdateInfo, executeType: ExecuteType) {
    if (this.state !== StateType.CheckingForUpdate) {
      throw new Error(`downloadUpdateFile:update status(${this.state}) error`);
    }
    const { url, signature } = updateInfo.files[0];
    const { downloadTargetDir } = this.availableUpdate;
    this.setState(StateType.Downloading);
    try {
      await downloadFile({
        logger: this.logger,
        url,
        signature,
        targetDir: downloadTargetDir,
        emit: this.emit,
        progressHandle: (data: any) => {
          this.emit(EventType.UPDATE_DOWNLOAD_PROGRESS, { ...data, executeType });
        },
      } as IDownloadFileOptions);
      this.logger.info('downloadUpdateFile:Downloaded');
      this.setState(StateType.Downloaded);
    } catch (e) {
      this.setState(StateType.Idle);
      e.customMessage = `${InstallResultType.DownloadError}_${e.message}`;
      this.logError(e);
    }
  }

  protected async unzip(): Promise<IInstallResult> {
    this.logger.info('unzip:start');
    try {
      const result = await this.doUnzip();
      if (!result.success) {
        return result;
      }
      const { latestAsarPath } = this.availableUpdate;
      const exist = await existFile(latestAsarPath);
      return Promise.resolve({ success: exist });
    } catch (error) {
      error.customMessage = InstallResultType.UpdateUnzipError;
      return Promise.resolve({
        success: false,
        error,
      });
    }
  }

  public dispatchError(e: Error): void {
    this.logError(e);
    this.emit(EventType.ERROR, e.message);
  }

  public logError(e: Error): void {
    const message = (e?.stack || e).toString();
    this.logger.error(message);
  }

  /**
   * 由子类实现的自定义方法
   */
  protected abstract doGetAvailableUpdateInfo(updateInfo: IUpdateInfo): IAvailableUpdate;
  protected abstract doPreCheckForPackage(): Promise<IInstallResult>;
  protected abstract doQuitAndInstallAsar(): Promise<IInstallResult>;
  protected abstract doQuitAndInstallPackage(): Promise<IInstallResult>;
  protected abstract doUnzip(): Promise<IInstallResult>;
}

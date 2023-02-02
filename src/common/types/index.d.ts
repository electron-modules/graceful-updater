import { UpdateType } from '@/common/constants';

export interface ILogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string | Error, ...args: any[]): void;
}

export interface IUpdateInfo {
  /** 最新版本 */
  version: string;
  /** 下载信息 */
  files: [
    {
      /** 下载地址 */
      url: string;
      /** 下载签名 */
      signature: string;
    },
  ];
  /** 更新类型  */
  updateType: UpdateType;
}

export interface IInstallResult {
  /**
   * 是否安装成功
   */
  success: boolean;
  /**
   * 异常类型
   */
  type?: InstallResultType;
  /**
   * 错误消息
   */
  message?: any;

  /**
   * 异常
   */
  error?: Error;
}

export interface IAppUpdatorOptions {
  logger?: ILogger;
  verify?: any;
  updateInfoFormatter?: (res: object) => object;
  dmgTitleFormatter?: (res: object, updateInfo: IUpdateInfo) => string;
  ifNeedUpdate: (res: object) => boolean;
  url: string;
  autoDownload?: boolean;
  productName?: string;
  getWindowsHelperExeDir?: () => string;
}

export interface IDownloadFileOptions {
  logger: ILogger;
  url: string;
  signature: string;
  targetDir: string;
  progressHandle: (status: DownloadProgressStatus) => void;
}

export interface IAvailableUpdate {
  /** 资源根路径 */
  resourcePath: string;
  /** 下载目标路径 */
  downloadTargetDir: string;
  /** 最新 asar 路径 */
  latestAsarPath: string;
}

export interface IAppAdapter {
  readonly name: string;

  readonly userDataPath: string;

  readonly exePath: string;

  quit(): void;

  exit(code: number): void;

  relaunch(code?: number): void;
}

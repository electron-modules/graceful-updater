/**
 * 更新包备份前缀
 */
export const OldArchivePrefix = 'old-';

/**
 * 安装结果类型
 */
export enum InstallResultType {
  UpdateUnzipError = 'update-unzip-error',
  DownloadError = 'download-error',
  UpdateSuccess = 'update-success',
  CheckForUpdatesError = 'check-for-updates-error',
}

/**
 * 更新状态
 */
export enum StateType {
  /**
   * 空闲
   */
  Idle = 'idle',
  /**
   * 检查更新中
   */
  CheckingForUpdate = 'checking-for-update',
  /**
   * 下载中
   */
  Downloading = 'downloading',
  /**
   * 下载完成
   */
  Downloaded = 'downloaded',
}

/**
 * 更新类型
 */
export enum UpdateType {
  /** 全量更新 */
  Package = 'package',
  /** 动态更新 */
  Asar = 'asar',
  /** 更新包更新 */
  Assets = 'assets',
}

/**
 * 执行类型
 */
export enum ExecuteType {
  /**
   * 自动触发
   */
  User = 'user',
  /**
   * 手动触发
   */
  Auto = 'auto',
}

/**
 * 执行类型
 */
export enum DownloadProgressStatus {
  /**
   * 开始
   */
  Begin = 'begin',

  /**
   * 下载中
   */
  Downloading = 'downloading',
  /**
   * 结束
   */
  End = 'end',
}

/**
 * 事件类型
 */
export enum EventType {
  /**
   * 下载完成
   */
  UPDATE_DOWNLOADED = 'update-downloaded',
  /**
   * 下载进度
   */
  UPDATE_DOWNLOAD_PROGRESS = 'update-download-progress',
  /**
   * 用户调用 quitAndInstall 之后发出，可在次事件后完成关闭窗口、重启等操作
   */
  BEFORE_QUIT_FOR_UPDATE = 'before-quit-for-update',
  /**
   * 有可用更新
   */
  UPDATE_AVAILABLE = 'update-available',
  /**
   * 开始检查更新
   */
  CHECKING_FOR_UPDATE = 'checking-for-update',
  /**
   * 无可用更新
   */
  UPDATE_NOT_AVAILABLE = 'update-not-available',

  /**
   * 错误
   */
  ERROR = 'error',
}

export enum FileName {
  RUNTIME_APP_ASAR = 'app.asar'
}

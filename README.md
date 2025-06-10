# graceful-updater

[![NPM version][npm-image]][npm-url]
[![CI][ci-image]][ci-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/graceful-updater.svg
[npm-url]: https://npmjs.org/package/graceful-updater
[ci-image]: https://github.com/electron-modules/graceful-updater/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/electron-modules/graceful-updater/actions/workflows/ci.yml
[node-image]: https://img.shields.io/badge/node.js-%3E=_16-green.svg
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/graceful-updater.svg
[download-url]: https://npmjs.org/package/graceful-updater

> Electron 应用软件更新解决方案，方便完成软件的全量更新和动态更新。

[English](./README.en.md) | 简体中文

## Installment

```bash
$ npm i graceful-updater --save
```

## 样例

点击查看： https://github.com/electron-modules/electron-modules-sample

```typescript
// 1. 构造 options
const options = {
  url: getFeedUrl(),
  logger: console, // logger
  productName: 'demo',
  updateInfoFormatter: (res) => {
    return res;
  },
  ifNeedUpdate: (res) => {
    console.log('local version', currentVersion);
    console.log('local project version', currentBuildNumber);
    console.log('remote version', res.version);
    console.log('remote project version', res.project_version);
    return semver.gt(res.version, currentVersion) ||
      res.project_version > currentBuildNumber;
  },
};
// 2. 初始化 updator 实例
const electronUpdator = new MacUpdator(options);
// 3. 绑定全局事件
electronUpdator.on(EventType.UPDATE_DOWNLOADED, (...args) => {
  console.log('updator >> %s, args: %j', EventType.UPDATE_DOWNLOADED, args);
});
electronUpdator.on(EventType.CHECKING_FOR_UPDATE, (...args) => {
  console.log('updator >> %s, args: %j', EventType.CHECKING_FOR_UPDATE, args);
});
electronUpdator.on(EventType.UPDATE_AVAILABLE, (data) => {
  const { version, project_version } = data?.updateInfo || {};
  const message = [
    'available',
    `local version: ${currentVersion}`,
    `local project version: ${currentBuildNumber}`,
    `remote version: ${version}`,
    `remote project version: ${project_version}`,
  ].join('\n');
  dialog.showMessageBoxSync({
    message,
  });
});
electronUpdator.on(EventType.UPDATE_NOT_AVAILABLE, (data) => {
  const { version, project_version } = data?.updateInfo || {};
  const message = [
    'not available',
    `local version: ${currentVersion}`,
    `local project version: ${currentBuildNumber}`,
    `remote version: ${version}`,
    `remote project version: ${project_version}`,
  ].join('\n');
  dialog.showMessageBoxSync({
    message,
  });
});
electronUpdator.on(EventType.ERROR, (...args) => {
  console.log('updator >> %s, args: %j', EventType.ERROR, args);
});
electronUpdator.on(EventType.UPDATE_DOWNLOAD_PROGRESS, (data) => {
  const { status, progress } = data;
  console.log('updator >> %s, status: %s, progress: %d', EventType.UPDATE_DOWNLOAD_PROGRESS, status, progress);
  app.windowManager.get('updator').webContents.send('updator:updateDownloadProgress', { status, progress });
});
```

## 文档

### 参数

| 字段 | 类型 | 是否必须 | 说明 | 默认值 |
| --- | --- | --- | --- | --- |
| url | String | 必须 | 检测更新的远程地址，返回数据遵循 `UpdateInfo` 对象 | |
| ifNeedUpdate | Function | 必须 | 返回是否需要更新 | |
| updateInfoFormatter | Function | 非必须 | 服务端返回数据格式适配。如果返回的格式无法与 `UpdateInfo` 相匹配时，可通过此方法进行格式化 |
| logger | Object | 非必须 | 日志 | `console` |
| productName | String | 必须 | 应用完整名称 | |
| autoDownload | String | 非必须 | 是否自动下载 | false |
| getWindowsHelperExeDir | Function | 非必须 | Windows 下 helper 目录 | false |


### UpdateInfo

| 字段 | 类型 | 是否必须 | 说明 | 默认值 |
| --- | --- | --- | --- | --- |
| version | String | 必须 | 版本号 | |
| projectVersion | Number | 非必须 | 构建号 | |
| files | Array\<Object\> | 必须 | 需要下载的文件列表，返回数据遵循 `File` 对象 | |
| updateType | Enum\<String\> | 必须 | 更新类型，全量更新或者动态更新。Package 为全量更新，Asar 为动态更新 | |
| releaseNotes | Array\<String\> | 必须 | 更新日志 | |

### File

| 字段 | 类型 | 是否必须 | 说明 | 默认值 |
| --- | --- | --- | --- | --- |
| url | String | 必须 | 下载地址 | |
| signature | String | 非必须 | 下载签名 | |
| updateType | Enum\<String\> | 必须 | 更新类型，针对动态更新或全量更新提供的下载地址。Package or Asar | |

### 方法

1. checkForUpdates(ExecuteType)

- `ExecuteType` 执行类型（User or Auto）

检测是否有需要更新的内容，如果 `ExecuteType` 为 User，则检查到更新后直接触发 `update-available` 事件，否则将自动下载完成安装包后触发 `update-available` 事件

2. setFeedUrl(url)

- url 新的更新 URL
根据不同场景需要，动态设置检查更新的 URL

2. downloadUpdate(ExecuteType)

- `ExecuteType` 执行类型（User or Auto）

开始下载安装包，如果 `ExecuteType` 为 User，则不进行预检查，下载完成后直接触发 `update-downloaded` 事件，否则完成内部完成预检查后再触发 `update-downloaded` 事件

3. quitAndInstall()
退出应用并开始安装。如果安装包已下载完成，将直接重启应用并进行新版本安装。否则进入下载流程


### 事件

1. checking-for-update

当开始检查更新的时候触发

2. update-available
- params：更新信息
- params.updateInfo：本次更新的信息 `UpdateInfo`

检测到有可用更新时触发

3. update-not-available
- params：更新信息
- params.updateInfo：本次更新的信息 `UpdateInfo`
 
检测到无可用更新时触发

4. update-download-progress

- params：下载过程中的进度及文件流信息。
- params.status 下载状态。 `begin` 开始下载，`downloading` 下载中，`end` 下载结束
- params.progress 当前下载进度百分比，0 ~ 100
- params.data 下载内容的文件流，可利用此数据进行签名校验


正在下载过程中触发

5. update-downloaded

完成下载时触发

6. error
- params：错误信息 `Error`

更新程序内部出现错误时触发

<!-- GITCONTRIBUTOR_START -->

## 贡献者

|[<img src="https://avatars.githubusercontent.com/u/1011681?v=4" width="100px;"/><br/><sub><b>xudafeng</b></sub>](https://github.com/xudafeng)<br/>|[<img src="https://avatars.githubusercontent.com/u/4081746?v=4" width="100px;"/><br/><sub><b>zlyi</b></sub>](https://github.com/zlyi)<br/>|[<img src="https://avatars.githubusercontent.com/u/30524126?v=4" width="100px;"/><br/><sub><b>z0gSh1u</b></sub>](https://github.com/z0gSh1u)<br/>|[<img src="https://avatars.githubusercontent.com/u/11213298?v=4" width="100px;"/><br/><sub><b>WynterDing</b></sub>](https://github.com/WynterDing)<br/>|[<img src="https://avatars.githubusercontent.com/u/52845048?v=4" width="100px;"/><br/><sub><b>snapre</b></sub>](https://github.com/snapre)<br/>|[<img src="https://avatars.githubusercontent.com/u/46579290?v=4" width="100px;"/><br/><sub><b>yinrouni</b></sub>](https://github.com/yinrouni)<br/>|
| :---: | :---: | :---: | :---: | :---: | :---: |


[git-contributor 说明](https://github.com/xudafeng/git-contributor)，自动生成时间：`Tue Jun 10 2025 19:00:22 GMT+0800`。

<!-- GITCONTRIBUTOR_END -->

## License

The MIT License (MIT)

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

> Software updates solution for Electron applications, It is convenient to complete full software update and dynamic update.
## Installment

```bash
$ npm i graceful-updater --save
```

## Sample

please visit: https://github.com/electron-modules/electron-modules-sample

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

## Documents

### Options

| 字段 | 类型 | 是否必须 | 描述 | 备注 |
| --- | --- | --- | --- | --- |
| url | String | 必须 | 检测更新的远程地址，返回数据遵循 UpdateInfo 字段 | |
| ifNeedUpdate | Function | 非必须 | 返回是否需要更新 | |
| updateInfoFormatter | Function | 非必须 | 服务端返回数据格式适配 | 如果返回的格式无法与需要的字段相匹配时，参数进行格式化 |
| logger | Object | 非必须 | 日志 | |
| productName | String | 产品名 | 应用名 | |

### UpdateInfo

| 字段 | 类型 | 是否必须 | 描述 | 备注 |
| --- | --- | --- | --- | --- |
| version | String | 必须 | 版本号 | |
| projectVersion | Number | 必须 | 构建号 | |
| files | Array<Object> | 必须 | 需要下载的文件列表 | |
| updateType | Enum<String> | 必须 | 更新类型，是否动态替换更新 | Package or Asar |
| releaseNotes | Array<String> | 必须 | 更新日志 | |

### Methods

1. checkForUpdates()

检测是否有需要更新的内容

2. downloadUpdate()

开始下载

3. quitAndInstall()

### Events

1. checking-for-update

当开始检查更新的时候触发

<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/4081746?v=4" width="100px;"/><br/><sub><b>zlyi</b></sub>](https://github.com/zlyi)<br/>|[<img src="https://avatars.githubusercontent.com/u/1011681?v=4" width="100px;"/><br/><sub><b>xudafeng</b></sub>](https://github.com/xudafeng)<br/>|[<img src="https://avatars.githubusercontent.com/u/52845048?v=4" width="100px;"/><br/><sub><b>snapre</b></sub>](https://github.com/snapre)<br/>|
| :---: | :---: | :---: |


This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Tue Jan 31 2023 14:31:40 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->

## License

The MIT License (MIT)

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

English | [简体中文](./README.md) 

## Installment

```bash
$ npm i graceful-updater --save
```

## Sample

please visit: https://github.com/electron-modules/electron-modules-sample

```typescript
// 1. options
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
// 2. initialization
const electronUpdator = new MacUpdator(options);

// 3. Bind events
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

| Param | Type | Required | Description | Default value |
| --- | --- | --- | --- | --- |
| url | String | Yes | Check for update remote address, and the returned data follows the `UpdateInfo` object | |
| ifNeedUpdate | Function | Yes | Check if update is required | |
| updateInfoFormatter | Function | No | The server returns data format adaptation. If the returned format cannot match the `UpdateInfo`, this method can be used to format |
| logger | Object | No | Log method | `console` |
| productName | String | Yes | Application Name | |
| autoDownload | String | No | Whether to download automatically | false |
| getWindowsHelperExeDir | Function | No | Windows helper directory | false |


### UpdateInfo

| Param | Type | Required | Description | Default value |
| --- | --- | --- | --- | --- |
| version | String | Yes | version | |
| projectVersion | Number | No | project version | |
| files | Array\<Object\> | Yes | The list of files to be downloaded. The returned data follows the `File` object | |
| updateType | Enum\<String\> | Yes | Update type, full update or dynamic update.Package is full update，Asar is dynamic update | |
| releaseNotes | Array\<String\> | Yes | The release notes. | |

### File

| Param | Type | Required | Description | Default value |
| --- | --- | --- | --- | --- |
| url | String | No | download address | |
| signature | String | No | download address signature | |
| updateType | Enum\<String\> | Yes | Update type, full update or dynamic update.Package is full update，Asar is dynamic update | |

### Methods

1. checkForUpdates(ExecuteType)

- `ExecuteType` ExecuteType(User or Auto)

Check whether there is content to be updated. If the `ExecuteType` is User, the `update-available` event will be triggered directly after the update is detected. Otherwise, the `update-available` event will be triggered after the package is automatically downloaded

2. setFeedUrl(url)

- url: New update URL
According to the needs of different scenarios, dynamically set the URL for checking updates

2. downloadUpdate(ExecuteType)

- `ExecuteType` ExecuteType(User or Auto)

Start downloading the installation package. If the `ExecuteType` is User, no pre-check will be performed. After the download is completed, the `update-downloaded` event will be triggered directly. Otherwise, the `update-downloaded` event will be triggered after the internal pre-check is completed


3. quitAndInstall()
Exit the app and start the installation. If the installation package has been downloaded, the application will be restarted directly and the new version will be installed. Otherwise, enter the download process

### Events

1. checking-for-update

Triggered when checking for updates

2. update-available
- params: update info
- params.updateInfo: `UpdateInfo`

Triggered when an available update is checked

3. update-not-available
- params: update info
- params.updateInfo: `UpdateInfo`
 
Triggered when no updates are checked

4. update-download-progress

- params: status and file info the download process.
- params.status: download status `begin`, `downloading`, `end`
- params.progress: Current download progress percentage. 0 ~ 100
- params.data: The file stream of downloaded content can be used for signature verification

Triggering during download

5. update-downloaded

Triggered when the download is complete

6. error
- params: `Error`

Triggered when an error occurs inside the updater

<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/1011681?v=4" width="100px;"/><br/><sub><b>xudafeng</b></sub>](https://github.com/xudafeng)<br/>|[<img src="https://avatars.githubusercontent.com/u/4081746?v=4" width="100px;"/><br/><sub><b>zlyi</b></sub>](https://github.com/zlyi)<br/>|[<img src="https://avatars.githubusercontent.com/u/30524126?v=4" width="100px;"/><br/><sub><b>z0gSh1u</b></sub>](https://github.com/z0gSh1u)<br/>|[<img src="https://avatars.githubusercontent.com/u/11213298?v=4" width="100px;"/><br/><sub><b>WynterDing</b></sub>](https://github.com/WynterDing)<br/>|[<img src="https://avatars.githubusercontent.com/u/52845048?v=4" width="100px;"/><br/><sub><b>snapre</b></sub>](https://github.com/snapre)<br/>|[<img src="https://avatars.githubusercontent.com/u/46579290?v=4" width="100px;"/><br/><sub><b>yinrouni</b></sub>](https://github.com/yinrouni)<br/>|
| :---: | :---: | :---: | :---: | :---: | :---: |


This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Tue Jun 10 2025 19:00:22 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->

## License

The MIT License (MIT)

import urllib from 'urllib';
import { IDownloadFileOptions } from '@/common/types';
import { DownloadProgressStatus } from '@/common/constants';
import { createWriteStream } from '.';

/**
 * 文件下载
 * @param updator 更新实例
 * @param url 下载地址
 * @param signature 下载签名
 * @param targeDir 下载目录
 * @param progressHandle 下载状态回调
 * @return
 */
export const downloadFile = async ({ logger, url, signature, targetDir, progressHandle }: IDownloadFileOptions) => {
  logger.info('downloadFile#downloadFile (start)');
  const writeStream = createWriteStream(targetDir);
  let currentLength = 0;
  let currentProgress = 0;
  progressHandle({
    status: DownloadProgressStatus.Begin,
  });
  return new Promise((resolve: (value?: unknown) => void, reject: (value: unknown) => void) => {
    urllib
      .request(url, {
        streaming: true,
        followRedirect: true,
        timeout: 10 * 60 * 1000,
      })
      .then((res: any) => {
        const totalLength = res.headers['content-length'];
        logger.info(`downloadFile#downloadFile (then),totalLength is ${totalLength}`);
        res.res.on('data', (data: any) => {
          try {
            currentLength += data.length;
            const progress = (currentLength / totalLength) * 100;
            if (progress > currentProgress) {
              currentProgress++;
            }
            progressHandle({
              status: DownloadProgressStatus.Downloading,
              progress: currentProgress,
              url,
              signature,
              data,
            });
            writeStream.write(data);
          } catch (e) {
            reject(e);
          }
        });
        res.res.on('end', () => {
          // 推迟调用 end(): https://stackoverflow.com/a/53878933
          process.nextTick(() => writeStream.end());
          try {
            progressHandle({
              status: DownloadProgressStatus.End,
              url,
              signature,
            });
            logger.info('downloadFile#download file success, url:%s, to %s', url, targetDir);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
        res.res.on('error', reject);
      });
  });
};

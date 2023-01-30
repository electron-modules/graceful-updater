import { IAppUpdatorOptions, ILogger } from 'common/types';
import { sudoPrompt } from './index';

function sudoPromptExec(appUpdatorOptions: IAppUpdatorOptions, logger: ILogger, shell: string) {
  const options = {
    name: appUpdatorOptions.productName,
  };
  return new Promise((resolve, reject) => {
    logger.warn(`update#sudoPromptExec_shell_${shell}`);
    sudoPrompt.exec(shell, options, (error: any, stdout: any, stderr: any) => {
      console.log(error, stdout, stderr);
      if (error) {
        reject(error);
        logger.error(`update#sudoPromptExec_error_${error}`);
        return;
      }
      resolve(stdout);
      logger.warn(`update#sudoPromptExec_stdout_${stdout}`);
    });
  });
}

export { sudoPromptExec };

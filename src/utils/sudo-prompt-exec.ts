import { IAppUpdatorOptions, ILogger } from 'common/types';
import { sudoPrompt } from './index';

function sudoPromptExec(appUpdatorOptions: IAppUpdatorOptions, logger: ILogger, shell: string) {
  const options = {
    name: appUpdatorOptions.productName,
  };
  return new Promise((resolve, reject) => {
    logger.warn(`ElectronUpdator#update#sudoPromptExec_shell_${shell}`);
    sudoPrompt.exec(shell, options, (error: any, stdout: any) => {
      if (error) {
        reject(error);
        logger.error(`ElectronUpdator#update#sudoPromptExec_error_${error}`);
        return;
      }
      resolve(stdout);
      logger.warn(`ElectronUpdator#update#sudoPromptExec_stdout_${stdout}`);
    });
  });
}

export { sudoPromptExec };

import { ILogger } from '@/common/types';
import { sudoPrompt } from './index';

function sudoPromptExec(logger: ILogger, shell: string) {
  const options = {
    name: 'SoftwareUpdate',
  };
  return new Promise((resolve, reject) => {
    logger.warn(`sudoPromptExec#_shell_${shell}`);
    sudoPrompt.exec(shell, options, (error: any, stdout: any) => {
      if (error) {
        reject(error);
        logger.error(`sudoPromptExec#error_${error}`);
        return;
      }
      resolve(stdout);
      logger.warn(`sudoPromptExec#stdout_${stdout}`);
    });
  });
}

export { sudoPromptExec };

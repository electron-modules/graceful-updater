import { IAppAdapter } from './common/types';
import { app as electronApp } from 'electron';

export class ElectronAppAdapter implements IAppAdapter {
  constructor(private readonly app = electronApp) {}
  get name(): string {
    return this.app.getName();
  }

  get isPackaged(): boolean {
    return this.app.isPackaged === true;
  }

  get userDataPath(): string {
    return this.app.getPath('userData');
  }

  get exePath(): string {
    return this.app.getPath('exe');
  }

  exit(code: number): void {
    this.app.exit(code);
  }

  relaunch(code: number): void {
    this.app.relaunch();
    this.app.exit(code);
  }

  quit(): void {
    this.app.quit();
  }
}

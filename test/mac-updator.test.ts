import { MacUpdator } from '../src/mac-updator';

const assert = (global as any).assert;

let updator: MacUpdator | null = null;
describe('test/MacUpdator.test.ts', () => {
  beforeEach(() => {
    updator = new MacUpdator({
      url: 'http://www.github.com',
    });
  });
});

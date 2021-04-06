import { EncodeURIComponentPipe } from './encode-uri-component.pipe';

describe('EncodeURIComponentPipe', () => {
  it('create an instance', () => {
    const pipe = new EncodeURIComponentPipe();
    expect(pipe).toBeTruthy();
  });
});

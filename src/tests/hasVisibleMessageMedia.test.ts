import hasVisibleMessageMedia from '@appManagers/utils/messages/hasVisibleMessageMedia';
import {setAppSettingsSilent} from '@stores/appSettings';

describe('hasVisibleMessageMedia', () => {
  afterEach(() => {
    setAppSettingsSilent('exportedSelfDestructMedia', false);
  });

  test('returns false for self-destructing media without payload', () => {
    expect(hasVisibleMessageMedia({
      _: 'message',
      pFlags: {},
      media: {
        _: 'messageMediaDocument',
        ttl_seconds: 2147483647,
        pFlags: {}
      }
    } as any)).toBe(false);
  });

  test('returns true for self-destructing media with exported document payload', () => {
    setAppSettingsSilent('exportedSelfDestructMedia', true);

    expect(hasVisibleMessageMedia({
      _: 'message',
      pFlags: {},
      media: {
        _: 'messageMediaDocument',
        ttl_seconds: 2147483647,
        pFlags: {video: true},
        document: {
          _: 'document',
          type: 'video'
        }
      }
    } as any)).toBe(true);
  });
});

import {makeMessageMediaInput} from '@appManagers/utils/messages/makeMessageMediaInput';

describe('makeMessageMediaInput', () => {
  test('preserves ttl for photos by default', () => {
    const inputMedia = makeMessageMediaInput({
      _: 'messageMediaPhoto',
      pFlags: {},
      ttl_seconds: 30,
      photo: {
        _: 'photo',
        id: '1',
        access_hash: '2',
        file_reference: new Uint8Array()
      }
    } as any);

    expect(inputMedia?._).toBe('inputMediaPhoto');
    expect((inputMedia as any).ttl_seconds).toBe(30);
  });

  test('drops ttl for self-destruct photos when preserveTtl is false', () => {
    const inputMedia = makeMessageMediaInput({
      _: 'messageMediaPhoto',
      pFlags: {},
      ttl_seconds: 30,
      photo: {
        _: 'photo',
        id: '1',
        access_hash: '2',
        file_reference: new Uint8Array()
      }
    } as any, {preserveTtl: false});

    expect(inputMedia?._).toBe('inputMediaPhoto');
    expect((inputMedia as any).ttl_seconds).toBeUndefined();
  });

  test('drops ttl for self-destruct documents when preserveTtl is false', () => {
    const inputMedia = makeMessageMediaInput({
      _: 'messageMediaDocument',
      pFlags: {},
      ttl_seconds: 45,
      document: {
        _: 'document',
        id: '1',
        access_hash: '2',
        file_reference: new Uint8Array()
      }
    } as any, {preserveTtl: false});

    expect(inputMedia?._).toBe('inputMediaDocument');
    expect((inputMedia as any).ttl_seconds).toBeUndefined();
  });
});

import shouldResendForwardAsCopy from '@appManagers/utils/messages/shouldResendForwardAsCopy';

describe('shouldResendForwardAsCopy', () => {
  test('returns true when the message itself has noforwards', () => {
    expect(shouldResendForwardAsCopy({
      _: 'message',
      pFlags: {noforwards: true}
    } as any)).toBe(true);
  });

  test('returns true when the source peer has noforwards', () => {
    expect(shouldResendForwardAsCopy({
      _: 'message',
      pFlags: {}
    } as any, true)).toBe(true);
  });

  test('returns false for ordinary forwardable messages', () => {
    expect(shouldResendForwardAsCopy({
      _: 'message',
      pFlags: {}
    } as any)).toBe(false);
  });

  test('returns false for service messages', () => {
    expect(shouldResendForwardAsCopy({
      _: 'messageService',
      pFlags: {}
    } as any, true)).toBe(false);
  });

  test('returns true for service messages when send-as-copy is forced', () => {
    expect(shouldResendForwardAsCopy({
      _: 'messageService',
      pFlags: {}
    } as any, false, true)).toBe(true);
  });

  test('returns true for ordinary messages when send-as-copy is forced', () => {
    expect(shouldResendForwardAsCopy({
      _: 'message',
      pFlags: {}
    } as any, false, true)).toBe(true);
  });
});

import rootScope from '@lib/rootScope';

describe('rootScope premium', () => {
  const originalSettings = rootScope.settings;
  const originalPremium = rootScope.premium;

  afterEach(() => {
    rootScope.settings = originalSettings;
    rootScope.premium = originalPremium;
  });

  test('treats pro mode as premium', () => {
    rootScope.settings = {proMode: true} as any;
    rootScope.premium = false;

    expect(rootScope.premium).toBe(true);
    expect(rootScope.getPremium()).toBe(true);
  });

  test('keeps premium disabled when both account and pro mode are off', () => {
    rootScope.settings = {proMode: false} as any;
    rootScope.premium = false;

    expect(rootScope.premium).toBe(false);
    expect(rootScope.getPremium()).toBe(false);
  });
});

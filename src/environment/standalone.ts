const IS_STANDALONE = typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(display-mode: standalone)').matches;
export default IS_STANDALONE;

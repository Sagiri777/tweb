const IS_WEBP_SUPPORTED = typeof document !== 'undefined' &&
  document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp');

export default IS_WEBP_SUPPORTED;

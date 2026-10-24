const IS_CANVAS_FILTER_SUPPORTED = typeof document !== 'undefined' &&
  'filter' in (document.createElement('canvas').getContext('2d') || {});

export default IS_CANVAS_FILTER_SUPPORTED;

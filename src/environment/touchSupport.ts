/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';
type DocumentTouchConstructor = new(...args: any[]) => EventTarget;
const documentTouch = hasWindow ? (window as typeof window & {DocumentTouch?: DocumentTouchConstructor}).DocumentTouch : undefined;

const IS_TOUCH_SUPPORTED = hasWindow && (
  ('ontouchstart' in window) ||
  (!!documentTouch && hasDocument && document instanceof documentTouch)
)/*  || true */;
export default IS_TOUCH_SUPPORTED;

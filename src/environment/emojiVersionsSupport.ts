import IS_EMOJI_SUPPORTED from '@environment/emojiSupport';

export type EMOJI_VERSION = '' | '14' | '15' | '15.1' | '16';

const CAN_USE_DOCUMENT = typeof document !== 'undefined';

const EMOJI_VERSIONS_SUPPORTED: {
  [v in EMOJI_VERSION]: boolean
} = {} as any;

// Thanks to WebZ for the detect
function isEmojiSupported(emoji: string) {
  const ALLOWABLE_CALCULATION_ERROR_SIZE = 5;
  const parent = document.body || document.documentElement;
  const inlineEl = document.createElement('span');
  inlineEl.classList.add('emoji');
  parent.appendChild(inlineEl);

  inlineEl.innerText = emoji; // Emoji from 14.0 version
  const newEmojiWidth = inlineEl.offsetWidth;
  inlineEl.innerText = '❤️'; // Emoji from 1.0 version
  const legacyEmojiWidth = inlineEl.offsetWidth;

  parent.removeChild(inlineEl);

  return Math.abs(newEmojiWidth - legacyEmojiWidth) < ALLOWABLE_CALCULATION_ERROR_SIZE;
}

if(IS_EMOJI_SUPPORTED) {
  EMOJI_VERSIONS_SUPPORTED[''] = true;

  const a: {[version in Exclude<EMOJI_VERSION, ''>]: string} = {
    '14': '🫱🏻',
    '15': '🫨',
    '15.1': '🙂‍↔️',
    '16': '🫩'
  };

  Object.entries(a).forEach(([version, emoji]) => {
    EMOJI_VERSIONS_SUPPORTED[version as EMOJI_VERSION] = CAN_USE_DOCUMENT && isEmojiSupported(emoji);
  });
}

export default EMOJI_VERSIONS_SUPPORTED;

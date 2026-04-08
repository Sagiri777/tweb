import {Message} from '@layer';
import hasVisibleMessageMedia from './hasVisibleMessageMedia';

export default function canSeeMessageMedia(message: Message) {
  return hasVisibleMessageMedia(message);
}

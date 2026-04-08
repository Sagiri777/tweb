import {isRestricted, isSensitive} from '@helpers/restrictions';
import {appSettings} from '@stores/appSettings';
import {Message} from '@layer';

export default function isMessageRestricted(message: Message.message) {
  if(appSettings.exportedSelfDestructMedia) {
    return false;
  }

  return !!(message.restriction_reason && isRestricted(message.restriction_reason));
}

export function isMessageSensitive(message: Message) {
  if(appSettings.exportedSelfDestructMedia) {
    return false;
  }

  return (message._ === 'message' && message.restriction_reason != null && isSensitive(message.restriction_reason));
}

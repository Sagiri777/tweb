import {Document, Message, MessageMedia} from '@layer';
import {appSettings} from '@stores/appSettings';
import {isUnlockedSelfDestructMedia} from './hasVisibleMessageMedia';

export function canSaveMessageMediaWithNoForwards(message: Message.message) {
  const document = (message.media as MessageMedia.messageMediaDocument)?.document;
  if(!document) {
    return false;
  }

  return !(['video', 'gif', 'round', 'sticker'] as Document.document['type'][]).includes((document as Document.document).type);
}

export default function canSaveMessageMedia(
  message: Message.message | Message.messageService,
  noForwards?: boolean
) {
  if(appSettings.proMode) {
    const media = (message as Message.message)?.media as MessageMedia;
    if(message?._ === 'message' && media) {
      return true;
    }
  }

  const isUnlocked = isUnlockedSelfDestructMedia(message as Message.message);

  return message &&
    (isUnlocked || !message.pFlags.is_outgoing) &&
    !((message as Message.message).media as MessageMedia.messageMediaInvoice)?.extended_media &&
    (
      isUnlocked ||
      !((message as Message.message).pFlags.noforwards || noForwards) ||
      canSaveMessageMediaWithNoForwards(message as Message.message)
    );
}

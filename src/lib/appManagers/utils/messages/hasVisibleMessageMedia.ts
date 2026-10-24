import {Document, Message, MessageMedia, Photo} from '@layer';
import {appSettings} from '@stores/appSettings';

function hasExportedSelfDestructPayload(media: MessageMedia) {
  const webpage = (media as MessageMedia.messageMediaWebPage).webpage as any as {
    photo?: Photo.photo,
    document?: Document.document
  };

  return !!(
    (media as MessageMedia.messageMediaPhoto).photo ||
    (media as MessageMedia.messageMediaDocument).document ||
    webpage?.photo ||
    webpage?.document
  );
}

export function isUnlockedSelfDestructMedia(message: Message) {
  const media = (message as Message.message)?.media;
  return !!(
    media &&
    (media as MessageMedia.messageMediaPhoto).ttl_seconds &&
    appSettings.proMode &&
    hasExportedSelfDestructPayload(media)
  );
}

export default function hasVisibleMessageMedia(message: Message) {
  const media = (message as Message.message)?.media;
  if(!media) {
    return false;
  }

  if(!(media as MessageMedia.messageMediaPhoto).ttl_seconds) {
    return true;
  }

  return isUnlockedSelfDestructMedia(message);
}

import {Message} from '@layer';

export default function shouldResendForwardAsCopy(
  message: Message.message | Message.messageService,
  peerHasNoForwards = false,
  forceCopy = false
) {
  if(!message) {
    return false;
  }

  if(forceCopy) {
    return true;
  }

  return message._ === 'message' && !!(
    message.pFlags?.noforwards ||
    peerHasNoForwards
  );
}

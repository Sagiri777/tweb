import {Message} from '@layer';

export default function shouldResendForwardAsCopy(
  message: Message.message | Message.messageService,
  peerHasNoForwards = false
) {
  return message?._ === 'message' && !!(
    message.pFlags?.noforwards ||
    peerHasNoForwards
  );
}

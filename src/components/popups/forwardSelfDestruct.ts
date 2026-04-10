import PopupElement from '@components/popups';
import PopupPeer from '@components/popups/peer';

export default function showForwardSelfDestructPopup() {
  return new Promise<boolean | undefined>((resolve) => {
    let settled = false;
    const finish = (value: boolean | undefined) => {
      if(settled) {
        return;
      }

      settled = true;
      resolve(value);
    };

    const popup = PopupElement.createPopup(PopupPeer, 'popup-confirmation', {
      title: 'How do you want to send self-destructing media?',
      description: 'These forwarded messages contain self-destructing media. You can keep the self-destruct timer, or resend them as regular messages.',
      buttons: [{
        text: document.createTextNode('Keep self-destruct'),
        callback: () => {
          finish(true);
        }
      }, {
        text: document.createTextNode('Send as regular'),
        callback: () => {
          finish(false);
        }
      }]
    });

    popup.addEventListener('close', () => {
      finish(undefined);
    });

    popup.show();
  });
}

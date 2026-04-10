/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import type {ChatRights} from '@appManagers/appChatsManager';
import type {MyDocument} from '@appManagers/appDocsManager';
import flatten from '@helpers/array/flatten';
import appImManager from '@lib/appImManager';
import rootScope from '@lib/rootScope';
import {toastNew} from '@components/toast';
import PopupPickUser from '@components/popups/pickUser';
import getMediaFromMessage from '@appManagers/utils/messages/getMediaFromMessage';
import getDocumentInput from '@appManagers/utils/docs/getDocumentInput';
import CheckboxField from '@components/checkboxField';
import Row from '@components/row';
import PopupElement from '.';
import showForwardSelfDestructPopup from './forwardSelfDestruct';
import {useAppConfig, useIsFrozen} from '@stores/appState';
import {appSettings} from '@stores/appSettings';
import {Message, MessageMedia} from '@layer';
import shouldResendForwardAsCopy from '@appManagers/utils/messages/shouldResendForwardAsCopy';

export default class PopupForward extends PopupPickUser {
  private sendAsCopy: boolean;

  constructor(
    peerIdMids?: {[fromPeerId: PeerId]: number[]},
    onSelect?: (peerId: PeerId, threadId?: number) => Promise<void> | void,
    chatRightsAction: ChatRights[] = ['send_plain'],
    noTopics?: boolean,
    forceSendAsCopy = false
  ) {
    super({
      peerType: ['dialogs', 'contacts'],
      onSelect: !peerIdMids && onSelect ? onSelect : async(peerId, threadId, monoforumThreadId) => {
        if(onSelect) {
          const res = onSelect(peerId);
          if(res instanceof Promise) {
            await res;
          }
        }

        if(peerId === rootScope.myId) {
          let preserveTtl = true;
          if(this.sendAsCopy) {
            const hasSelfDestructMessages = (await Promise.all(Object.keys(peerIdMids).map((fromPeerIdKey) => {
              const fromPeerId = fromPeerIdKey.toPeerId();
              return this.managers.appMessagesManager.hasSelfDestructMessages(fromPeerId, peerIdMids[fromPeerId]);
            }))).some(Boolean);

            if(hasSelfDestructMessages) {
              const choice = await showForwardSelfDestructPopup();
              if(choice === undefined) {
                return;
              }

              preserveTtl = choice;
            }
          }

          let count = 0;
          for(const fromPeerId in peerIdMids) {
            const mids = peerIdMids[fromPeerId];
            count += mids.length;
            if(mids.length === 1) {
              const message = await this.managers.appMessagesManager.getMessageByPeer(fromPeerId.toPeerId(), mids[0]) as Message.message;
              if(message?.pFlags?.fakeForSavedMusic) {
                const doc = (message.media as MessageMedia.messageMediaDocument).document as MyDocument;
                this.managers.appMessagesManager.sendOther({
                  peerId,
                  inputMedia: {_: 'inputMediaDocument', id: getDocumentInput(doc), pFlags: {}}
                });
                this.managers.appMessagesManager.deleteMessageFromHistoryStorage(fromPeerId.toPeerId(), mids[0]);
                continue;
              }
            }
            this.managers.appMessagesManager[this.sendAsCopy ? 'copyMessages' : 'forwardMessages']({
              peerId,
              fromPeerId: fromPeerId.toPeerId(),
              mids,
              preserveTtl
            });
          }

          toastNew({
            langPackKey: count > 1 ? 'FwdMessagesToSavedMessages' : 'FwdMessageToSavedMessages'
          });

          return;
        }

        await appImManager.setInnerPeer({peerId, threadId, monoforumThreadId});
        appImManager.chat.input.initMessagesForward(peerIdMids, this.sendAsCopy);
      },
      placeholder: 'ShareModal.Search.ForwardPlaceholder',
      chatRightsActions: chatRightsAction,
      selfPresence: 'ChatYourSelf',
      useTopics: !noTopics,
      ...(useIsFrozen() && {
        getMoreCustom: async() => {
          const appConfig = useAppConfig();
          const peer = await rootScope.managers.appUsersManager.resolveUsername(appConfig.freeze_appeal_url.split('/').pop());
          return {
            result: [peer.id.toPeerId(peer._ !== 'user')],
            isEnd: true
          };
        },
        peerType: ['custom'],
        noSearch: true,
        headerLangPackKey: 'Forward'
      })
    });

    this.sendAsCopy = forceSendAsCopy || appSettings.forwarding.sendAsCopy;

    const checkboxField = new CheckboxField({
      checked: this.sendAsCopy,
      disabled: forceSendAsCopy,
      listenerSetter: this.listenerSetter
    });

    this.listenerSetter.add(checkboxField.input)('change', () => {
      this.sendAsCopy = checkboxField.checked;
    });

    const row = new Row({
      title: 'Forward without source',
      subtitle: forceSendAsCopy ?
        'This selection must be resent as a new message from you.' :
        'Temporarily resend this forward as a new message from you.',
      checkboxField,
      havePadding: true,
      listenerSetter: this.listenerSetter
    });

    this.body.prepend(row.container);
  }

  public static async create(...args: ConstructorParameters<typeof PopupForward>) {
    const [peerIdMids] = args;
    const messagesPromises = Object.keys(peerIdMids).map((peerId) => {
      const mids = peerIdMids[peerId as any as number];
      return mids.map((mid) => {
        return rootScope.managers.appMessagesManager.getMessageByPeer(peerId.toPeerId(), mid);
      });
    });

    const messages = await Promise.all(flatten(messagesPromises));
    const actions: Set<ChatRights> = new Set();
    messages.forEach((message) => {
      if(!message) {
        return;
      }

      const media = getMediaFromMessage(message);
      let action: ChatRights;
      if(!media) {
        if(message.viaBotId) {
          action = 'send_inline';
        } else {
          action = 'send_plain';
        }
      } else {
        if(media._ === 'webPage') {
          action = 'embed_links';
        } else if(media._ === 'photo') {
          action = 'send_photos';
        } else if(media._ === 'game') {
          action = 'send_games';
        } else {
          switch(media.type) {
            case 'audio':
              action = 'send_audios';
              break;
            case 'gif':
              action = 'send_gifs';
              break;
            case 'round':
              action = 'send_roundvideos';
              break;
            case 'sticker':
              action = 'send_stickers';
              break;
            case 'voice':
              action = 'send_voices';
              break;
            case 'video':
              action = 'send_videos';
              break;
            default:
              action = 'send_docs';
              break;
          }
        }
      }

      if(action) {
        actions.add(action);
      }
    });

    const forceSendAsCopy = (await Promise.all(messages.map(async(message) => {
      return shouldResendForwardAsCopy(
        message as Message.message,
        message ? await rootScope.managers.appPeersManager.noForwards(message.peerId) : false,
        appSettings.forwarding.sendAsCopy
      );
    }))).some(Boolean);

    PopupElement.createPopup(PopupForward, args[0], args[1], Array.from(actions), undefined, forceSendAsCopy);
  }
}

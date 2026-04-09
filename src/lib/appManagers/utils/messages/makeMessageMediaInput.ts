import {InputGeoPoint, InputMedia, InputPeer, MessageMedia} from '@layer';
import getDocumentInput from '@appManagers/utils/docs/getDocumentInput';
import getPhotoInput from '@appManagers/utils/photos/getPhotoInput';
import rootScope from '@lib/rootScope';
import getPeerId from '@appManagers/utils/peers/getPeerId';

function makeInputGeoPoint(geo: MessageMedia.messageMediaGeo['geo']): InputGeoPoint {
  if(!geo || geo._ !== 'geoPoint') {
    return {_: 'inputGeoPointEmpty'};
  }

  return {
    _: 'inputGeoPoint',
    lat: geo.lat,
    long: geo.long,
    accuracy_radius: geo.accuracy_radius
  };
}

export function makeMessageMediaInput(media: MessageMedia, options: Partial<{
  preserveTtl: boolean
}> = {}): InputMedia | undefined {
  if(!media) return;
  const preserveTtl = options.preserveTtl ?? true;

  if(media._ === 'messageMediaPhoto' && media.photo?._ === 'photo') {
    return {
      _: 'inputMediaPhoto',
      id: getPhotoInput(media.photo),
      pFlags: {
        spoiler: media.pFlags.spoiler
      },
      ttl_seconds: preserveTtl ? media.ttl_seconds : undefined
    }
  }

  if(media._ === 'messageMediaDocument' && media.document?._ === 'document') {
    return {
      _: 'inputMediaDocument',
      id: getDocumentInput(media.document),
      pFlags: {
        spoiler: media.pFlags.spoiler
      },
      video_cover: media.video_cover?._ === 'photo' ? getPhotoInput(media.video_cover) : undefined,
      ttl_seconds: preserveTtl ? media.ttl_seconds : undefined
    }
  }

  if(media._ === 'messageMediaContact') {
    return {
      _: 'inputMediaContact',
      user_id: media.user_id,
      phone_number: media.phone_number,
      first_name: media.first_name,
      last_name: media.last_name,
      vcard: media.vcard
    }
  }

  if(media._ === 'messageMediaGeo') {
    return {
      _: 'inputMediaGeoPoint',
      geo_point: makeInputGeoPoint(media.geo)
    };
  }

  if(media._ === 'messageMediaVenue') {
    return {
      _: 'inputMediaVenue',
      geo_point: makeInputGeoPoint(media.geo),
      title: media.title,
      address: media.address,
      provider: media.provider,
      venue_id: media.venue_id,
      venue_type: media.venue_type
    };
  }

  if(media._ === 'messageMediaGeoLive') {
    return {
      _: 'inputMediaGeoLive',
      pFlags: {},
      geo_point: makeInputGeoPoint(media.geo),
      heading: media.heading,
      period: media.period,
      proximity_notification_radius: media.proximity_notification_radius
    };
  }

  if(media._ === 'messageMediaPoll') {
    const correctAnswers = media.results?.results
      ?.filter((result) => result.pFlags?.correct)
      .map((result) => result.option);

    return rootScope.managers.appPollsManager.getInputMediaPoll(
      media.poll,
      correctAnswers?.length ? correctAnswers : undefined,
      media.results?.solution,
      media.results?.solution_entities
    ) as unknown as InputMedia.inputMediaPoll;
  }

  if(media._ === 'messageMediaDice') {
    return {
      _: 'inputMediaDice',
      emoticon: media.emoticon
    };
  }

  if(media._ === 'messageMediaStory') {
    return {
      _: 'inputMediaStory',
      peer: rootScope.managers.appPeersManager.getInputPeerById(getPeerId(media.peer)) as unknown as InputPeer,
      id: media.id
    };
  }

  if(media._ === 'messageMediaToDo') {
    return {
      _: 'inputMediaTodo',
      todo: media.todo
    };
  }
}

export function makeMessageMediaInputForSuggestedPost(media: MessageMedia) {
  if(media && (
    media._ === 'messageMediaPhoto' && media.photo?._ === 'photo' ||
    media._ === 'messageMediaDocument' && media.document?._ === 'document'
    // media._ === 'messageMediaContact
  )) {
    return makeMessageMediaInput(media);
  }
}

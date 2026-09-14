import React from 'react';
import { OverlapWidget, FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import { PHOTOS } from '../src/theme/photos';

export function TodayAffirmationWidget({ text, photoKey }) {
  let imageSource =
    photoKey && photoKey.startsWith('http') ? photoKey : PHOTOS[photoKey] || PHOTOS.default;

  return (
    <OverlapWidget style={{ height: 'match_parent', width: 'match_parent' }}>
        <ImageWidget
        image={imageSource}
        imageWidth={300}
        imageHeight={400}
        resizeMode="cover"
        style={{ height: 'match_parent', width: 'match_parent' }}
      />

    <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
    <TextWidget
          text={text || 'Peace and love, friend.'}
          style={{
            fontSize: 16,
            color: '#ffffff',
            textAlign: 'center',
            textShadowColor: '#00000099',
            textShadowRadius: 6,
          }}
        />
      </FlexWidget>
    </OverlapWidget>
  );
}
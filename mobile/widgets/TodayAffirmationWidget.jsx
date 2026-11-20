import React from 'react';
import { OverlapWidget, FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import { PHOTOS } from '../src/theme/photos';

// Cloudinary photos: have Cloudinary crop to the widget's shape, centered on the subject
function widgetPhoto(url) {
  return url.includes('/image/upload/')
    ? url.replace('/image/upload/', '/image/upload/c_fill,g_auto,w_600,h_450/')
    : url;
}

// Android widget text can't mix bold and regular, so drop the markdown markers
function plain(text) {
  return String(text || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}
export function TodayAffirmationWidget({ text, photoKey }) {
  let isUrl = !!(photoKey && photoKey.startsWith('http'));
  let imageSource = isUrl ? widgetPhoto(photoKey) : PHOTOS[photoKey] || PHOTOS.sky;

  return (
    <OverlapWidget style={{ height: 'match_parent', width: 'match_parent' }}>
        <ImageWidget
        image={imageSource}
        imageWidth={isUrl ? 600 : 300}
        imageHeight={isUrl ? 450 : 650}
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
          backgroundColor: '#00000033',
        }}
      >
    <TextWidget
          text={plain(text) || 'Peace and love, friend.'}
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
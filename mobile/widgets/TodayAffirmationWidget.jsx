import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function TodayAffirmationWidget({ text }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#1A1A1A',
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
        }}
      />
    </FlexWidget>
  );
}
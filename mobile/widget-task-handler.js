import React from 'react';
import { TodayAffirmationWidget } from './widgets/TodayAffirmationWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function widgetTaskHandler(props) {
  let widgetInfo = props.widgetInfo;

  if (widgetInfo.widgetName !== 'TodayAffirmation') return;

  let text = await AsyncStorage.getItem('widgetAffirmationText');
  let photoKey = await AsyncStorage.getItem('widgetTodayPhoto');

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(<TodayAffirmationWidget text={text} photoKey={photoKey} />);
      break;
    default:
      break;
  }
}
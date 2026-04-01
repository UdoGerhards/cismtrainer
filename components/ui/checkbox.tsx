import { Checkbox as CheckboxLib } from '@futurejj/react-native-checkbox';
import React from 'react';
import { View } from 'react-native';

export default function Checkbox(props: any) {
  const { style, ...rest } = props;
  return (
    <View style={style}>
      <CheckboxLib {...rest} />
    </View>
  );
}
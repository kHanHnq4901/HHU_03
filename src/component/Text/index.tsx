import React from 'react';
import { Text as _Text, TextProps } from 'react-native';
import { Fonts } from '../../theme';

type Props = TextProps;

export const Text = (props: Props) => {
  return (
    <_Text {...props} style={{ ...props.style, fontFamily: Fonts }}>
      {props.children}
    </_Text>
  );
};

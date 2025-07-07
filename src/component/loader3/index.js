import React, { Component } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const random = () => parseInt(Math.random() * 255);
const randomColor = () =>
  'rgb(' + random() + ',' + random() + ',' + random() + ')';
const size = 50;
const innerSize = size / 5;

const color1 = randomColor();
const color2 = randomColor();
const color3 = randomColor();
const color4 = randomColor();
const color5 = randomColor();

export default class Loader3 extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.color1 = color1;
    this.color2 = color2;
    this.color3 = color3;
    this.color4 = color4;
    this.color5 = color5;
    this.animation = new Animated.Value(0);
  }

  componentDidMount = () => {
    Animated.loop(
      Animated.timing(this.animation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  };
  render() {
    const Dim = size;
    const angle = this.animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '72deg', '360deg'],
    });
    const angle0 = this.animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '144deg', '360deg'],
    });
    const angle1 = this.animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '216deg', '360deg'],
    });
    const angle2 = this.animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '288deg', '360deg'],
    });
    const angle3 = this.animation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['0deg', '360deg', '360deg'],
    });
    const outerAngle = this.animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '720deg'],
    });

    return (
      <View style={styles.container}>
        <Animated.View
          style={{
            width: Dim,
            height: Dim,
            transform: [{ rotate: outerAngle }],
          }}>
          <Animated.View
            style={{ ...styles.item, transform: [{ rotate: angle3 }] }}>
            <View
              style={{
                ...styles.innerItem,
                backgroundColor: this.color1,
              }}
            />
          </Animated.View>
          <Animated.View
            style={{ ...styles.item, transform: [{ rotate: angle2 }] }}>
            <View
              style={{
                ...styles.innerItem,
                backgroundColor: this.color2,
              }}
            />
          </Animated.View>
          <Animated.View
            style={{ ...styles.item, transform: [{ rotate: angle1 }] }}>
            <View
              style={{
                ...styles.innerItem,
                backgroundColor: this.color3,
              }}
            />
          </Animated.View>
          <Animated.View
            style={{ ...styles.item, transform: [{ rotate: angle0 }] }}>
            <View
              style={{
                ...styles.innerItem,
                backgroundColor: this.color4,
              }}
            />
          </Animated.View>
          <Animated.View
            style={{ ...styles.item, transform: [{ rotate: angle }] }}>
            <View
              style={{
                ...styles.innerItem,
                backgroundColor: this.color5,
              }}
            />
          </Animated.View>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    width: size,
    height: size,
    borderWidth: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    justifyContent: 'center',
  },
  innerItem: {
    height: innerSize / 10,
    width: innerSize,
  },
});

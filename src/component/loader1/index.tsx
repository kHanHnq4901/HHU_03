import React, { Component } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { scale } from '../../theme';

const random = () => parseInt((Math.random() * 350).toString());
const randomColor = () =>
  'rgb(' + random() + ',' + random() + ',' + random() + ')';
//const randomColor = () => 'rgba(15,248,29,1)';
const size = 30 * scale;
const dim = 90 * scale;

let backgroundColor = randomColor();

export default class Loader1 extends Component {
  animation = new Animated.Value(0);
  componentDidMount = () => {
    Animated.loop(
      Animated.timing(this.animation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start(event => {
      //backgroundColor = randomColor();
      //console.log('finish saffffffffffffeeeeeeeeeeeeee');
    });
  };
  render() {
    const inputRange = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
    const left1 = this.animation.interpolate({
      inputRange,
      outputRange: [
        0,
        dim - size,
        dim - size,
        0,
        0,
        0,
        dim - size,
        dim - size,
        0,
      ],
    });
    const top1 = this.animation.interpolate({
      inputRange,
      outputRange: [
        0,
        0,
        dim - size,
        dim - size,
        0,
        dim - size,
        dim - size,
        0,
        0,
      ],
    });
    const left2 = this.animation.interpolate({
      inputRange,
      outputRange: [
        dim - size,
        0,
        0,
        dim - size,
        dim - size,
        dim - size,
        0,
        0,
        dim - size,
      ],
    });
    const top2 = this.animation.interpolate({
      inputRange,
      outputRange: [
        dim - size,
        dim - size,
        0,
        0,
        dim - size,
        0,
        0,
        dim - size,
        dim - size,
      ],
    });
    const left3 = this.animation.interpolate({
      inputRange,
      outputRange: [
        0,
        0,
        dim - size,
        dim - size,
        0,
        dim - size,
        dim - size,
        0,
        0,
      ],
    });
    const top3 = this.animation.interpolate({
      inputRange,
      outputRange: [
        dim - size,
        0,
        0,
        dim - size,
        dim - size,
        dim - size,
        0,
        0,
        dim - size,
      ],
    });
    const left4 = this.animation.interpolate({
      inputRange,
      outputRange: [
        dim - size,
        dim - size,
        0,
        0,
        dim - size,
        0,
        0,
        dim - size,
        dim - size,
      ],
    });
    const top4 = this.animation.interpolate({
      inputRange,
      outputRange: [
        0,
        dim - size,
        dim - size,
        0,
        0,
        0,
        dim - size,
        dim - size,
        0,
      ],
    });
    const angleValue = this.animation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '720deg'],
    });

    return (
      <View style={styles.container}>
        <View style={{ width: dim, height: dim }}>
          <Animated.View
            style={{
              ...styles.item,
              backgroundColor,
              transform: [
                { translateX: left1 },
                { translateY: top1 },
                { rotate: angleValue },
              ],
            }}
          />
          <Animated.View
            style={{
              ...styles.item,
              backgroundColor,
              transform: [
                { translateX: left2 },
                { translateY: top2 },
                { rotate: angleValue },
              ],
            }}
          />
          <Animated.View
            style={{
              ...styles.item,
              backgroundColor,
              transform: [
                { translateX: left3 },
                { translateY: top3 },
                { rotate: angleValue },
              ],
            }}
          />
          <Animated.View
            style={{
              ...styles.item,
              backgroundColor,
              transform: [
                { translateX: left4 },
                { translateY: top4 },
                { rotate: angleValue },
              ],
            }}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10000000 },
  item: { width: size, height: size, position: 'absolute' },
});

import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export const PulsingDot = ({ color }: { color: string }) => {
  // Tạo 3 vòng tròn, mỗi cái có animation riêng
  const circles = Array.from({ length: 3 }).map(() => ({
    scale: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }));

  useEffect(() => {
    const animations = circles.map((circle, index) =>
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(index * 500), // delay so le, tạo hiệu ứng nối tiếp
            Animated.timing(circle.scale, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(circle.scale, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(index * 500),
            Animated.timing(circle.opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(circle.opacity, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      )
    );

    animations.forEach((anim) => anim.start());
    return () => animations.forEach((anim) => anim.stop());
  }, []);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {circles.map((circle, index) => (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: color,
            opacity: circle.opacity,
            transform: [{ scale: circle.scale }],
          }}
        />
      ))}
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: "#fff",
        }}
      />
    </View>
  );
};

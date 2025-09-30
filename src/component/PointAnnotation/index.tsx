import React from "react";
import { View } from "react-native";

export const PulsingDot = ({ color }: { color: string }) => {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          width: 20, 
          height: 20,
          borderRadius: 10,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: "#fff",
        }}
      />
    </View>
  );
};

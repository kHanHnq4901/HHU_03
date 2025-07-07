import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapView, Camera } from '@maplibre/maplibre-react-native';
import { GetHook, onDeInit, onInit } from './controller';
import { useNavigation } from '@react-navigation/native';

const apiKey = 'ahHbn6NppVl10aLVFicq8Bp6w5LrqFkUf658DKhY'; // API key eKMap

export const MapScreen = () => {
  GetHook();

  const navigation = useNavigation();

  React.useEffect(() => {
    onInit(navigation);
    return () => {
      onDeInit(navigation);
    };
  }, []);
  const mapStyle = `https://api.ekgis.vn/v2/mapstyles/style/osmplus/bright/style.json?api_key=${apiKey}`;

  return (
      <MapView
        style={styles.map}
        mapStyle={mapStyle}
        compassEnabled={true}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        <Camera
          zoomLevel={10}
          centerCoordinate={[105.85, 21.03]} // Ví dụ: Hà Nội
        />
      </MapView>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
});

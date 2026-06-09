// MeterMap.tsx
import React, { useRef } from "react";

import { Camera, FillLayer, LineLayer, MapView, PointAnnotation, ShapeSource } from "@track-asia/trackasia-react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { PulsingDot } from "../PointAnnotation";
import { BlinkingDot } from "../blinkingDot";
import * as turf from '@turf/turf';
type MeterMapProps = {
  currentLocation: number[];
  listMeter: any[];
  selectedStatus: number | undefined;
  setSelectedMeterNo: (meterNo: string) => void;
  onReadMeter: (meterNo: string) => void;
  setRouteCoords: (coords: [number, number][]) => void;
  routeCoords: [number, number][];
};

export const MeterMap = ({
  currentLocation,
  listMeter,
  selectedStatus,
  setSelectedMeterNo,
  onReadMeter,
  routeCoords,
  setRouteCoords,
}: MeterMapProps) => {
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      mapStyle="https://maps.track-asia.com/styles/v2/streets.json?key=f4a6c08959b47211756357354b1b73ac74"
      compassEnabled
      zoomEnabled
      scrollEnabled
      rotateEnabled
      pitchEnabled
      attributionEnabled
    >
      <Camera
        ref={cameraRef}
        zoomLevel={15}
        centerCoordinate={currentLocation}
      />

      {routeCoords.length > 0 && (
        <ShapeSource
          id="route"
          shape={{
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: routeCoords,
            },
            properties: {},
          }}
        >
          <LineLayer id="routeLine" style={{ lineColor: "#2196F3", lineWidth: 4 }} />
        </ShapeSource>
      )}

      <PointAnnotation
        key="current-location"
        id="current-location"
        coordinate={currentLocation}
        anchor={{ x: 0.5, y: 1 }}
      >
        <MaterialCommunityIcons
          name="map-marker"
          size={40}
          color="#d32f2f"
          style={{ textShadowColor: "#000", textShadowRadius: 2 }}
        />
      </PointAnnotation>

      {listMeter.map((meter, index) => {
        if (!meter.COORDINATE) return null;
        const [latStr, lonStr] = meter.COORDINATE.split(',').map((v: string) => v.trim());
        const latitude = parseFloat(latStr);
        const longitude = parseFloat(lonStr);
        if (isNaN(latitude) || isNaN(longitude)) return null;

        let dotColor = '#9e9e9e';
        let DotComponent = PulsingDot;
        switch (Number(meter.STATUS)) {
          case 0: dotColor = '#9e9e9e'; break;
          case 1: dotColor = '#4caf50'; break;
          case 2: dotColor = '#f44336'; break;
          case 4: dotColor = '#ff9800'; break;
          case 6: dotColor = '#00f'; DotComponent = BlinkingDot; break;
        }

        return (
          <PointAnnotation
            key={`${index}-${meter.STATUS}`}
            id={`${index}`}
            coordinate={[longitude, latitude]}
            onSelected={() => {
              setSelectedMeterNo(meter.METER_NO);
              onReadMeter(meter.METER_NO);
            }}
          >
            <DotComponent color={dotColor} />
          </PointAnnotation>
        );
      })}

      {/* Circle around current location */}
      {currentLocation && (
        <ShapeSource
          id="circle"
          shape={turf.circle(currentLocation, 1, { steps: 64, units: "kilometers" })}
        >
          <FillLayer
            id="circleFill"
            style={{
              fillColor: "rgba(0,150,255,0.2)",
              fillOutlineColor: "rgba(0,150,255,0.8)",
            }}
          />
        </ShapeSource>
      )}
    </MapView>
  );
};

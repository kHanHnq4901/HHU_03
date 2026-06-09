// ManualReadScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

import { GetHookProps, store } from './controller';
import { 
  requestLocationPermission, 
  stopReading, 
  clearLocationWatch, 
  readMetersOnce, 
  readOneMeter, 
  fetchData, 
  onClose, 
  getDirections
} from './handleButton';
import { MeterDataModal } from '../../component/meterDataModal';
import { MeterListModal } from '../../component/meterListModal';
import { ReadingBar } from '../../component/readingBar';
import { MeterMap } from '../../component/meterMap';
import { Camera, MapView } from '@track-asia/trackasia-react-native';
import { StatusBar } from '../../component/statusBar';
import { FloatingReadButton } from '../../component/floatingReadButton';
import { getDistanceValue } from '../../util/location';

const polyline = require('@trackasia/polyline');

// Enum cho trạng thái
enum MeterStatus {
  UNREAD = 0,
  READ = 1,
  FAIL = 2,
  WARNING = 4,
}

export const ManualReadScreen: React.FC = () => {
  const hookProps = GetHookProps();
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      stopReading();
      clearLocationWatch();
    };
  }, []);

  // Hàm decode polyline để dùng cho cả handleNavigateWithRoute
  const decodePolyline = (encoded: string): [number, number][] =>
    polyline.decode(encoded).map(([lat, lng]: [number, number]) => [lng, lat]);

  const handleNavigateWithRoute = async (meter: any) => {
    if (!meter?.COORDINATE || !hookProps.state.currentLocation) return;
  
    const origin = `${hookProps.state.currentLocation[1]},${hookProps.state.currentLocation[0]}`; // lat,lng
    const destination = meter.COORDINATE; // "lat,lng"
  
    try {
      const data = await getDirections(origin, destination, store.state.appSetting.setting.vehicle);
      if (data?.routes?.[0]?.overview_polyline?.points) {
        const coords = decodePolyline(data.routes[0].overview_polyline.points);
        setRouteCoords(coords);
        hookProps.setState(prev => ({ ...prev, modalVisible: false }));
        if (coords.length > 0) {
          cameraRef.current?.fitBounds(
            coords[0],
            coords[coords.length - 1],
            [50, 50, 50, 50]
          );
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy directions:", error);
    }
  };

  const moveToMeter = (meter: any) => {
    if (!meter?.COORDINATE) return;
    const [latStr, lonStr] = meter.COORDINATE.split(',').map((v: string) => v.trim());
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);
    if (!isNaN(latitude) && !isNaN(longitude)) {
      hookProps.setState(prev => ({ ...prev, modalVisible: false }));
    }
  };
  const onShowMeterData = (meterNo: string) => {
    hookProps.setState(prev => ({
      ...prev,
      modalVisible: false,
      selectedMeterNo: meterNo,
      isShowDataModal: true,
    }));
    fetchData(meterNo, hookProps);
  };

  // Đếm số lượng meter theo status
  const counts = (hookProps.state.listMeter || []).reduce(
    (acc: Record<number, number>, item: any) => {
      const status = item.STATUS ?? MeterStatus.UNREAD;
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const getModalTitle = (status: number | undefined) => {
    switch (status) {
      case MeterStatus.FAIL: return 'Danh sách Thất bại';
      case MeterStatus.UNREAD: return 'Danh sách Chưa đọc';
      case MeterStatus.READ: return 'Danh sách Đã đọc';
      case MeterStatus.WARNING: return 'Danh sách Cảnh báo';
      default: return '';
    }
  };

  if (!hookProps.state.currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10 }}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
   
      <MeterMap
        currentLocation={hookProps.state.currentLocation}
        listMeter={hookProps.state.listMeter}
        selectedStatus={hookProps.state.selectedStatus}
        setSelectedMeterNo={(meterNo) => hookProps.setState(prev => ({ ...prev, selectedMeterNo: meterNo }))}
        onReadMeter={readMetersOnce}
        routeCoords={routeCoords}
        setRouteCoords={setRouteCoords}
      />
      {hookProps.state.readingStatus && (
        <ReadingBar
          status={hookProps.state.readingStatus?.status}
          meterNo={hookProps.state.readingStatus?.meterNo}
          name={hookProps.state.readingStatus?.name}
        />
      )}
      <StatusBar 
        counts={counts} 
        onSelectStatus={(status) => 
          hookProps.setState(prev => ({ ...prev, selectedStatus: status, modalVisible: true }))
        } 
      />

      <FloatingReadButton onPress={readMetersOnce}  />

      <MeterListModal
        visible={hookProps.state.modalVisible}
        onClose={() => hookProps.setState(prev => ({ ...prev, modalVisible: false }))}
        title={getModalTitle(hookProps.state.selectedStatus)}
        meters={hookProps.state.listMeter}
        selectedStatus={hookProps.state.selectedStatus}
        onReadMeter={readOneMeter}
        onShowData={onShowMeterData}
        onNavigate={moveToMeter}
        onNavigateWithRoute={handleNavigateWithRoute}
      />

      <MeterDataModal
        visible={hookProps.state.isShowDataModal}
        onClose={onClose}
        meterData={hookProps.state.meterData}
        isLoading={hookProps.state.isLoading}
        textLoading={hookProps.state.textLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});

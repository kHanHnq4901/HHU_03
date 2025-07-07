// metro.config.js

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

// Bước 1: Lấy config mặc định
const defaultConfig = getDefaultConfig(__dirname);

// Bước 2: Tùy chỉnh thêm nếu cần
const customConfig = {
  // Bạn có thể thêm config tùy chỉnh tại đây
};

// Bước 3: Gộp và bọc với reanimated
const mergedConfig = mergeConfig(defaultConfig, customConfig);

// Bước 4: Export
module.exports = wrapWithReanimatedMetroConfig(mergedConfig);

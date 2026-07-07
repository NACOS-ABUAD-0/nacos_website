import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { PrimaryButton } from './primary-button';

interface Props {
  onScan: (data: string) => void;
}

/**
 * Wraps expo-camera's QR scanning for a single shot: fires `onScan` once per
 * mount (onBarcodeScanned keeps firing while a QR stays in frame, so a local
 * lock stops duplicate calls) and stops there. To scan again, the parent
 * remounts this component by changing its `key` prop — same reset-by-remount
 * pattern used elsewhere in this app, simpler than exposing an imperative
 * "unlock" method.
 */
export function QRScannerView({ onScan }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const locked = useRef(false);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-center text-gray-600">
          Camera access is needed to scan QR codes.
        </Text>
        <PrimaryButton title="Grant Camera Access" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <CameraView
      style={{ flex: 1 }}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={({ data }) => {
        if (locked.current) return;
        locked.current = true;
        onScan(data);
      }}
    />
  );
}

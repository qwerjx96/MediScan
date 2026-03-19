import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAppStore } from '@/stores/appStore';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const geminiConsented = useAppStore((s) => s.geminiConsented);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      router.replace({
        pathname: '/scanner/processing',
        params: { imageUri: photo?.uri ?? '', geminiConsented: String(geminiConsented) },
      });
    } catch {
      Alert.alert('Camera error', 'Could not capture photo. Please try again.');
      setCapturing(false);
    }
  }, [capturing, geminiConsented, router]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera access is required to scan medicine labels.
        </Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Overlay frame */}
        <View style={styles.overlay}>
          <View style={styles.frame} />
          <Text style={styles.hint}>
            Point at the medicine label or package
          </Text>
        </View>
      </CameraView>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable onPress={() => router.back()} style={styles.controlBtn}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </Pressable>

        <Pressable
          onPress={handleCapture}
          style={[styles.shutterBtn, capturing && styles.shutterDisabled]}
          disabled={capturing}
        >
          {capturing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/scanner/search')}
          style={styles.controlBtn}
        >
          <Ionicons name="search" size={28} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: { flex: 1, width: '100%' },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: 280,
    height: 180,
    borderWidth: 2,
    borderColor: Colors.clinicalBlue,
    borderRadius: 12,
  },
  hint: {
    marginTop: 16,
    color: Colors.white,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 24,
    paddingHorizontal: 40,
    width: '100%',
  },
  controlBtn: { padding: 8 },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.clinicalBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
  },
  shutterDisabled: { opacity: 0.6 },
  shutterInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
  },
  permissionText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
    marginBottom: 24,
  },
  btn: {
    backgroundColor: Colors.clinicalBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
});

import * as ImagePicker from 'expo-image-picker';
import { UploadsService } from '@bharatsales/api-client';

export interface CapturedPhoto {
  uri: string;
}

// Launches the native camera (not gallery — attendance selfies and shopfront
// photos must be freshly captured, not picked from an old photo) and returns
// the local file URI, or null if the user cancelled/denied permission.
export async function captureCameraPhoto(): Promise<CapturedPhoto | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission denied. Please enable camera access to continue.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.6, // matches field-pwa's compressImage() intent — keep uploads small on flaky mobile data
    allowsEditing: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return { uri: result.assets[0].uri };
}

// Uploads a captured photo to the same POST /uploads/visit-photo endpoint
// field-pwa uses, via UploadsService.uploadVisitPhoto — React Native's
// FormData accepts a { uri, name, type } descriptor in place of a web Blob,
// so this reuses the existing client method as-is rather than duplicating
// the upload call.
export async function uploadCapturedPhoto(photo: CapturedPhoto, filename: string): Promise<string> {
  const fileDescriptor = { uri: photo.uri, name: filename, type: 'image/jpeg' } as unknown as Blob;
  const { url } = await UploadsService.uploadVisitPhoto(fileDescriptor, filename);
  return url;
}

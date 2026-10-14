import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { uid, type TaskImage } from './types';

function imagesDir(): Directory {
  const dir = new Directory(Paths.document, 'images');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

// Seçilen resmi uygulamanın kalıcı klasörüne kopyalar
function keep(asset: ImagePicker.ImagePickerAsset): TaskImage {
  const id = uid('i');
  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase().slice(0, 4);
  const dest = new File(imagesDir(), `${id}.${ext}`);
  new File(asset.uri).copy(dest);
  return { id, uri: dest.uri, width: asset.width, height: asset.height };
}

export async function pickFromLibrary(): Promise<TaskImage[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('İzin gerekli', 'Resim eklemek için galeri iznini ayarlardan açabilirsin.');
    return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.7,
  });
  return res.canceled ? [] : res.assets.map(keep);
}

export async function takePhoto(): Promise<TaskImage[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('İzin gerekli', 'Fotoğraf çekmek için kamera iznini ayarlardan açabilirsin.');
    return [];
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
  return res.canceled ? [] : res.assets.map(keep);
}

export function deleteImageFile(img: TaskImage): void {
  try {
    const f = new File(img.uri);
    if (f.exists) f.delete();
  } catch {
    /* dosya zaten yoksa sorun değil */
  }
}

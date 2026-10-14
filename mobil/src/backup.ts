import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import type { Task, TaskImage } from './types';
import { dateStr } from './dates';

interface BackupImage {
  id: string;
  uri: string;
  width: number;
  height: number;
  dataUrl: string;
}

interface BackupData {
  app: 'is-listesi';
  version: 1;
  exportedAt: string;
  tasks: Task[];
  images: BackupImage[];
}

async function fileToBase64(uri: string): Promise<string | null> {
  try {
    const f = new File(uri);
    if (!f.exists) return null;
    return await f.base64();
  } catch {
    return null;
  }
}

async function collectImages(tasks: Task[]): Promise<BackupImage[]> {
  const result: BackupImage[] = [];
  for (const t of tasks) {
    for (const img of t.images) {
      const b64 = await fileToBase64(img.uri);
      if (b64) {
        result.push({ id: img.id, uri: img.uri, width: img.width, height: img.height, dataUrl: `data:image/jpeg;base64,${b64}` });
      }
    }
  }
  return result;
}

export async function exportBackup(tasks: Task[]): Promise<{ count: number; imgCount: number } | null> {
  const images = await collectImages(tasks);
  const data: BackupData = {
    app: 'is-listesi',
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
    images,
  };

  const filename = `is-listesi-yedek-${dateStr(new Date())}.json`;
  const path = Paths.cache.uri + '/' + filename;
  const f = new File(path);
  f.write(JSON.stringify(data));

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert('Paylaşım mevcut değil', 'Bu cihazda dosya paylaşımı desteklenmiyor.');
    return null;
  }

  await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Yedeği paylaş' });
  return { count: tasks.length, imgCount: images.length };
}

export async function importBackup(): Promise<{ tasks: Task[]; restoredImages: Map<string, string> } | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.length) return null;

  const uri = result.assets[0].uri;
  try {
    const f = new File(uri);
    const text = await f.text();
    const data = JSON.parse(text) as BackupData;
    if (data.app !== 'is-listesi' || !Array.isArray(data.tasks)) {
      Alert.alert('Geçersiz dosya', 'Bu uygulamadan alınmış bir .json yedeği seçtiğinden emin ol.');
      return null;
    }

    const imgDir = Paths.document.uri + '/images';
    const restoredImages = new Map<string, string>();

    for (const img of data.images ?? []) {
      if (!img.dataUrl) continue;
      try {
        const base64 = img.dataUrl.split(',')[1];
        if (!base64) continue;
        const ext = img.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const dest = `${imgDir}/${img.id}.${ext}`;
        const destFile = new File(dest);
        destFile.write(base64, { encoding: 'base64' });
        restoredImages.set(img.id, destFile.uri);
      } catch {
        // bozuk resim atlanır
      }
    }

    return { tasks: data.tasks, restoredImages };
  } catch {
    Alert.alert('Dosya okunamadı', 'Yedek dosyası bozuk veya bu uygulama ile uyumsuz.');
    return null;
  }
}

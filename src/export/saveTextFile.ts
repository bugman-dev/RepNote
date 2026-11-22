import { Platform } from 'react-native';
import { StorageAccessFramework } from 'expo-file-system/legacy';

export type SaveResult = {
  cancelled: boolean;
};

function downloadOnWeb(fileName: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function saveTextFile(fileName: string, contents: string): Promise<SaveResult> {
  if (Platform.OS === 'web') {
    downloadOnWeb(fileName, contents);
    return { cancelled: false };
  }

  if (Platform.OS !== 'android') {
    throw new Error('Saving a text file uses Android’s folder picker.');
  }

  const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) {
    return { cancelled: true };
  }

  const displayName = fileName.replace(/\.txt$/i, '');
  const uri = await StorageAccessFramework.createFileAsync(
    permission.directoryUri,
    displayName,
    'text/plain',
  );
  await StorageAccessFramework.writeAsStringAsync(uri, contents, { encoding: 'utf8' });
  return { cancelled: false };
}

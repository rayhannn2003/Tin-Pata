import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

export const PDF_STORAGE_DIR = 'pdfs';

export class PdfStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfStorageError';
  }
}

export function getPdfDirectory(): Directory {
  return new Directory(Paths.document, PDF_STORAGE_DIR);
}

export async function ensurePdfDirectory(): Promise<Directory> {
  const directory = getPdfDirectory();
  if (!directory.exists) {
    directory.create();
  }
  return directory;
}

export function getLocalPdfUri(bookId: string): string {
  return new File(getPdfDirectory(), `${bookId}.pdf`).uri;
}

export async function pickPdf(): Promise<DocumentPicker.DocumentPickerAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset.uri) {
    throw new PdfStorageError('The selected file has no readable URI.');
  }

  return asset;
}

export async function copyPdfToAppStorage(
  sourceUri: string,
  bookId: string,
): Promise<{ localUri: string; fileSize: number }> {
  const source = new File(sourceUri);
  if (!source.exists) {
    throw new PdfStorageError('The selected PDF file could not be read.');
  }

  const directory = await ensurePdfDirectory();
  const destination = new File(directory, `${bookId}.pdf`);

  if (destination.exists) {
    destination.delete();
  }

  await source.copy(destination);

  if (!destination.exists) {
    throw new PdfStorageError('Failed to save the PDF to app storage.');
  }

  const info = destination.info();
  return {
    localUri: destination.uri,
    fileSize: info.size ?? 0,
  };
}

export async function importPdfFromPicker(
  bookId: string,
  asset: DocumentPicker.DocumentPickerAsset,
): Promise<{ localUri: string; fileSize: number }> {
  return copyPdfToAppStorage(asset.uri, bookId);
}

export async function deleteLocalPdf(bookId: string): Promise<void> {
  const file = new File(getPdfDirectory(), `${bookId}.pdf`);
  if (file.exists) {
    file.delete();
  }
}

export function fileExists(localUri: string): boolean {
  try {
    return new File(localUri).exists;
  } catch {
    return false;
  }
}

export function fileExistsForBook(bookId: string): boolean {
  try {
    return new File(getPdfDirectory(), `${bookId}.pdf`).exists;
  } catch {
    return false;
  }
}

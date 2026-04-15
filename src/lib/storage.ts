import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage } from '@/lib/firebase';

export type UploadProgress = (progress: number) => void;

/**
 * Upload a file to Firebase Storage and return its public download URL.
 * @param path  Storage path, e.g. "clinics/{uid}/license.pdf"
 * @param file  The File object from an <input type="file">
 * @param onProgress  Optional callback receiving 0–100 progress
 */
export async function uploadFile(
  path: string,
  file: File,
  onProgress?: UploadProgress
): Promise<string> {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(pct);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/**
 * Upload a clinic document (license, sanitary certificate, etc.)
 */
export async function uploadClinicDocument(
  clinicId: string,
  docType: 'license' | 'sanCert',
  file: File,
  onProgress?: UploadProgress
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `clinics/${clinicId}/${docType}.${ext}`;
  return uploadFile(path, file, onProgress);
}

/**
 * Upload a doctor credential document
 */
export async function uploadDoctorDocument(
  doctorId: string,
  docType: 'diploma' | 'certificate' | 'license',
  file: File,
  onProgress?: UploadProgress
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `doctors/${doctorId}/${docType}.${ext}`;
  return uploadFile(path, file, onProgress);
}

/**
 * Upload a platform document (created via Document Management module)
 */
export async function uploadPlatformDocument(
  docId: string,
  file: File,
  onProgress?: UploadProgress
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'pdf';
  const path = `documents/${docId}/file.${ext}`;
  return uploadFile(path, file, onProgress);
}

/**
 * Delete a file from storage by its full path or download URL
 */
export async function deleteFile(pathOrUrl: string): Promise<void> {
  const storage = getFirebaseStorage();
  const fileRef = pathOrUrl.startsWith('https://')
    ? ref(storage, pathOrUrl)
    : ref(storage, pathOrUrl);
  await deleteObject(fileRef);
}

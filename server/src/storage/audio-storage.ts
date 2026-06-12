// Audio storage: uploaded files stay on local disk.
// Multer lands uploads locally; Whisper reads from the same path.
import path from 'node:path';

export interface AudioStorage {
  /** Persists the uploaded file and returns its location URI. */
  store(localPath: string): Promise<string>;
}

class LocalAudioStorage implements AudioStorage {
  async store(localPath: string): Promise<string> {
    return `local:${path.basename(localPath)}`;
  }
}

export const audioStorage = new LocalAudioStorage();

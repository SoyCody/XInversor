import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_AVATAR_PATH = path.join(__dirname, '..', 'assets', 'default-avatar.png');

let cached = null;

// Se lee una sola vez y se cachea en memoria: se usa en cada registro.
const getDefaultAvatar = () => {
  if (!cached) {
    cached = {
      buffer: fs.readFileSync(DEFAULT_AVATAR_PATH),
      mimeType: 'image/png',
    };
  }
  return cached;
};

export { getDefaultAvatar };

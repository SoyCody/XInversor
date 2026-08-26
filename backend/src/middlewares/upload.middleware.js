import multer from 'multer';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB: se guarda directo en la BD

class InvalidFileTypeError extends Error {
  constructor() {
    super('Tipo de archivo no permitido. Solo se aceptan imágenes PNG, JPG o WEBP');
    this.name = 'InvalidFileTypeError';
    this.statusCode = 400;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new InvalidFileTypeError());
    }
    cb(null, true);
  },
});

// Multer reporta sus errores (tipo/tamaño) via callback en vez de
// lanzarlos al siguiente middleware normal, por eso se envuelve aquí
// en vez de usar upload.single(...) directo en la ruta.
const uploadAvatar = (req, res, next) => {
  upload.single('avatar')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La imagen no debe superar los 2MB' });
      }
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof InvalidFileTypeError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    next();
  });
};

export { uploadAvatar, ALLOWED_MIME_TYPES };

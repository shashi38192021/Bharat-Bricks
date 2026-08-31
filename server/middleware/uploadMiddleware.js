import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log("[Upload middleware] Incoming file metadata", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  });

  if (file.mimetype.startsWith("image/")) {
    console.log("[Upload middleware] File accepted");
    cb(null, true);
  } else {
    console.log("[Upload middleware] File rejected: not an image");
    cb(new Error("Only image files are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

console.log("[Upload middleware] Multer configured", {
  storage: "memoryStorage",
  fileSizeLimitMb: 10,
});

export default upload;

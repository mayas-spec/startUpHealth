// Uploading files using multer
const multer = require("multer");
const path = require("path");

// this configures where and how files will be stored on my server
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
    // save all uploaded files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    // create unique filename using timestamp + original name to avoid conflicts
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  // only allow image files - this regex checks for common image extensions
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  // check both the file extension and the mime type for security
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if(mimetype && extname){
    return cb(null, true);
    // file is allowed
  } else {
    cb(new Error('Only image files are allowed'));
    // reject the file
  }
};

// putting it all together
const upload = multer({
  storage,
  // where and how to store files
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5MB limit - prevents huge files from being uploaded
  fileFilter
});

module.exports = upload;
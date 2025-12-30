const multer = require("multer");

const storage = multer.memoryStorage(); // Store image in buffer
const upload = multer({ storage });

module.exports = upload;

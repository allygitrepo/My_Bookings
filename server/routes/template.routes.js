const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const templateController = require("../controllers/template.controller");
const authMiddleware = require("../middleware/auth.middleware");
const portalAdminMiddleware = require("../middleware/portalAdmin.middleware");

// Ensure uploads/temp directory exists
const tempUploadDir = path.join(__dirname, "../uploads/temp");
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'template-' + uniqueSuffix + '.zip');
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB Limit
    fileFilter: (req, file, cb) => {
        const isZip = path.extname(file.originalname).toLowerCase() === '.zip';
        if (isZip) {
            return cb(null, true);
        }
        cb(new Error("Only ZIP archive files (.zip) are allowed!"));
    }
});

router.get("/all", authMiddleware, templateController.getAll);
router.post("/upload", authMiddleware, portalAdminMiddleware, upload.single("templateZip"), templateController.uploadZip);
router.put("/:templateId", authMiddleware, portalAdminMiddleware, templateController.updateTemplate);
router.delete("/:templateId", authMiddleware, portalAdminMiddleware, templateController.deleteTemplate);

module.exports = router;

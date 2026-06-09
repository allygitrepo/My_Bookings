const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const templateController = require("../controllers/template.controller");
const authMiddleware = require("../middleware/auth.middleware");
const portalAdminMiddleware = require("../middleware/portalAdmin.middleware");

// Multer ZIP Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, "../uploads/temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "template-" + uniqueSuffix + ".zip");
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for rich zip templates
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === ".zip") {
            return cb(null, true);
        }
        cb(new Error("Only ZIP archive files are allowed."));
    }
});

// --- Public/Client-Side Routes (Authenticated) ---
router.get("/active", authMiddleware, templateController.getActiveTemplates);

// --- Super Admin Portal Routes (Admin Protected) ---
router.get("/portal", authMiddleware, portalAdminMiddleware, templateController.portalGetTemplates);
router.post(
    "/portal/deploy",
    authMiddleware,
    portalAdminMiddleware,
    upload.single("zipFile"),
    templateController.portalDeployTemplate
);
router.put(
    "/portal/:id",
    authMiddleware,
    portalAdminMiddleware,
    templateController.portalUpdateTemplate
);
router.delete("/portal/:id", authMiddleware, portalAdminMiddleware, templateController.portalDeleteTemplate);

// --- Public/Template Rendering Routes (Unauthenticated) - Defined at the bottom to avoid shadowing ---
router.all("/:templateId/:businessId", templateController.renderTemplateFile);
router.all("/:templateId/:businessId/*file", templateController.renderTemplateFile);

module.exports = router;

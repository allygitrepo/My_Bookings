const express = require("express");
const router = express.Router();
const packageController = require("../controllers/package.controller");
const authMiddleware = require("../middleware/auth.middleware");
const portalAdminMiddleware = require("../middleware/portalAdmin.middleware");

// Public routes (for landing page)
router.get("/active", (req, res, next) => {
    req.query.activeOnly = 'true';
    next();
}, packageController.getAll);

// Routes accessible by any authenticated user
router.use(authMiddleware);
router.get("/:id", packageController.getById);

// Protected routes (Portal Admin only)
router.use(portalAdminMiddleware);

router.get("/", packageController.getAll);
router.post("/", packageController.create);
router.put("/:id", packageController.update);
router.delete("/:id", packageController.delete);
router.post("/assign", packageController.assignToUser);

module.exports = router;

const express = require("express");
const router = express.Router();
const businessController = require("../controllers/business.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { limitCheck } = require("../utils/subscriptionGuard");

router.post("/create", authMiddleware, limitCheck('business'), businessController.create);
router.get("/all", authMiddleware, businessController.getAll);
router.get("/usage/:id", businessController.getPublicUsage);
router.get("/public/:slug", businessController.getBySlug);
router.get("/public/id/:id", businessController.getPublicById);
router.get("/:id", authMiddleware, businessController.getById);
router.put("/update/:id", authMiddleware, businessController.update);
router.delete("/delete/:id", authMiddleware, businessController.delete);

module.exports = router;

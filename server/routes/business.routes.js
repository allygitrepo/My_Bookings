const express = require("express");
const router = express.Router();
const businessController = require("../controllers/business.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, businessController.create);
router.get("/all", authMiddleware, businessController.getAll);
router.get("/public/:slug", businessController.getBySlug);
router.get("/:id", authMiddleware, businessController.getById);
router.put("/update/:id", authMiddleware, businessController.update);
router.delete("/delete/:id", authMiddleware, businessController.delete);

module.exports = router;

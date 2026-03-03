const express = require("express");
const router = express.Router();
const apiKeyController = require("../controllers/apiKey.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, apiKeyController.create);
router.get("/all", authMiddleware, apiKeyController.getAll);
router.get("/:id", authMiddleware, apiKeyController.getById);
router.put("/update/:id", authMiddleware, apiKeyController.update);
router.delete("/delete/:id", authMiddleware, apiKeyController.delete);

module.exports = router;

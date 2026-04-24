const express = require("express");
const router = express.Router();
const locationController = require("../controllers/location.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { limitCheck } = require("../utils/subscriptionGuard");

router.post("/create", authMiddleware, limitCheck('location'), locationController.create);
router.get("/all", authMiddleware, locationController.getAll);
router.get("/:id", authMiddleware, locationController.getById);
router.put("/update/:id", authMiddleware, locationController.update);
router.delete("/delete/:id", authMiddleware, locationController.delete);

module.exports = router;

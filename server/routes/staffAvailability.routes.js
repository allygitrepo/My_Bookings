const express = require("express");
const router = express.Router();
const staffAvailabilityController = require("../controllers/staffAvailability.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, staffAvailabilityController.create);
router.get("/all", authMiddleware, staffAvailabilityController.getAll);
router.get("/:id", authMiddleware, staffAvailabilityController.getById);
router.put("/update/:id", authMiddleware, staffAvailabilityController.update);
router.delete("/delete/:id", authMiddleware, staffAvailabilityController.delete);

module.exports = router;

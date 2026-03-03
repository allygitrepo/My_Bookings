const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, bookingController.create);
router.get("/all", authMiddleware, bookingController.getAll);
router.get("/:id", authMiddleware, bookingController.getById);
router.put("/update/:id", authMiddleware, bookingController.update);
router.delete("/delete/:id", authMiddleware, bookingController.delete);

module.exports = router;

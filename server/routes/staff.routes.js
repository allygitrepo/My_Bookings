const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staff.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, staffController.create);
router.get("/all", authMiddleware, staffController.getAll);
router.get("/:id", authMiddleware, staffController.getById);
router.put("/update/:id", authMiddleware, staffController.update);
router.delete("/delete/:id", authMiddleware, staffController.delete);

module.exports = router;

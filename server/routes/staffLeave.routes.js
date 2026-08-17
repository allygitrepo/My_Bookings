const express = require("express");
const router = express.Router();
const staffLeaveController = require("../controllers/staffLeave.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/all", authMiddleware, staffLeaveController.getAll);
router.get("/get/:id", authMiddleware, staffLeaveController.getById);
router.post("/create", authMiddleware, staffLeaveController.create);
router.put("/update/:id", authMiddleware, staffLeaveController.update);
router.delete("/delete/:id", authMiddleware, staffLeaveController.delete);

module.exports = router;

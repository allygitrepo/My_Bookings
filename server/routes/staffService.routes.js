const express = require("express");
const router = express.Router();
const staffServiceController = require("../controllers/staffService.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, staffServiceController.create);
router.get("/all", authMiddleware, staffServiceController.getAll);
router.get("/:id", authMiddleware, staffServiceController.getById);
router.put("/update/:id", authMiddleware, staffServiceController.update);
router.delete("/delete/:id", authMiddleware, staffServiceController.delete);

module.exports = router;

const express = require("express");
const router = express.Router();
const businessClosureController = require("../controllers/businessClosure.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/all", authMiddleware, businessClosureController.getAll);
router.get("/get/:id", authMiddleware, businessClosureController.getById);
router.post("/create", authMiddleware, businessClosureController.create);
router.put("/update/:id", authMiddleware, businessClosureController.update);
router.delete("/delete/:id", authMiddleware, businessClosureController.delete);

module.exports = router;

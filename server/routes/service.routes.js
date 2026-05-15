const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { limitCheck } = require("../utils/subscriptionGuard");

router.post("/create", authMiddleware, limitCheck('service'), serviceController.create);
router.get("/all", authMiddleware, serviceController.getAll);
router.get("/:id", authMiddleware, serviceController.getById);
router.put("/update/:id", authMiddleware, serviceController.update);
router.delete("/delete/:id", authMiddleware, serviceController.delete);

module.exports = router;

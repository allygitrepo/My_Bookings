const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, customerController.create);
router.get("/all", authMiddleware, customerController.getAll);
router.get("/:id", authMiddleware, customerController.getById);
router.put("/update/:id", authMiddleware, customerController.update);
router.delete("/delete/:id", authMiddleware, customerController.delete);

module.exports = router;

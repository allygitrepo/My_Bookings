const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/create", authMiddleware, userController.create);
router.get("/all", authMiddleware, userController.getAll);
router.get("/:id", authMiddleware, userController.getById);
router.put("/update/:id", authMiddleware, userController.update);
router.delete("/delete/:id", authMiddleware, userController.delete);

module.exports = router;

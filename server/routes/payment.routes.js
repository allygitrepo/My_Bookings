const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, paymentController.create);
router.post("/razorpay/order", authMiddleware, paymentController.createRazorpayOrder);
router.post("/razorpay/verify", authMiddleware, paymentController.verifyRazorpayPayment);
router.get("/all", authMiddleware, paymentController.getAll);
router.get("/:id", authMiddleware, paymentController.getById);
router.put("/update/:id", authMiddleware, paymentController.update);
router.delete("/delete/:id", authMiddleware, paymentController.delete);

module.exports = router;

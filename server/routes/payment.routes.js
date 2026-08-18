const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/create", authMiddleware, paymentController.create);
router.post("/razorpay/order", authMiddleware, paymentController.createRazorpayOrder);
router.post("/razorpay/verify", authMiddleware, paymentController.verifyRazorpayPayment);
router.post("/stripe/create-checkout-session", authMiddleware, paymentController.createStripeCheckoutSession);
router.post("/stripe/verify", authMiddleware, paymentController.verifyStripePayment);
router.get("/all", authMiddleware, paymentController.getAll);
router.get("/:id", authMiddleware, paymentController.getById);
router.put("/update/:id", authMiddleware, paymentController.update);
router.put("/settle", authMiddleware, paymentController.settlePayments);
router.delete("/delete/:id", authMiddleware, paymentController.delete);
router.post("/razorpay/webhook", paymentController.handleWebhook);

module.exports = router;

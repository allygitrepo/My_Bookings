const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscription.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.use(authMiddleware);

router.post("/create-order", subscriptionController.createOrder);
router.post("/verify-payment", subscriptionController.verifyPayment);
router.post("/activate-free", subscriptionController.activateFree);

module.exports = router;

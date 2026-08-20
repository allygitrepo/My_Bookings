const express = require('express');
const router = express.Router();
const serviceTypeController = require('../controllers/serviceType.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/all', authMiddleware, serviceTypeController.getAll);
router.post('/create', authMiddleware, serviceTypeController.create);
router.delete('/delete/:id', authMiddleware, serviceTypeController.delete);

module.exports = router;

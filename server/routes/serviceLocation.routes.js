const express = require('express');
const router = express.Router();
const serviceLocationController = require('../controllers/serviceLocation.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/create', authMiddleware, serviceLocationController.create);
router.get('/all', authMiddleware, serviceLocationController.getAll);
router.get('/:id', authMiddleware, serviceLocationController.getById);
router.put('/update/:id', authMiddleware, serviceLocationController.update);
router.delete('/delete/:id', authMiddleware, serviceLocationController.delete);

module.exports = router;

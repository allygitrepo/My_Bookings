const express = require('express');
const router = express.Router();
const { googleAuth } = require('../controllers/googleAuth.controller');

router.post('/auth-code', googleAuth);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe, refresh } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation } = require('../middleware/validationMiddleware');

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
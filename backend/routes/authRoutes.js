const express = require('express');
const router = express.Router();
const {
  register, login, googleAuth, getMe, updateMe,
  updateProfile, changePassword, updateNotifPrefs,
  exportData, deleteAccount, refresh
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation } = require('../middleware/validationMiddleware');

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/google', googleAuth);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

// Settings routes
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/notification-preferences', protect, updateNotifPrefs);
router.get('/export-data', protect, exportData);
router.delete('/account', protect, deleteAccount);

module.exports = router;
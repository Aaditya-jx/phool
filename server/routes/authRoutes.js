const express = require('express');
const router = express.Router();
const { registerUser, authUser, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', authUser);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

module.exports = router;

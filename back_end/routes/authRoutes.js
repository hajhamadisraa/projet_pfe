const express = require('express');
const router  = express.Router();

const {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

// Routes publiques (pas besoin d'être connecté)
router.post('/register', register);
router.post('/login',    login);

// Routes protégées (token obligatoire)
router.get('/me',                protect, getProfile);
router.put('/updateprofile',     protect, updateProfile);
router.put('/updatepassword',    protect, updatePassword);

module.exports = router;
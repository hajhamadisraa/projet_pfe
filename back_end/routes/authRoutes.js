const router = require('express').Router();
const { login, register, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login',    login);
router.get('/me',        protect, getProfile);

module.exports = router;
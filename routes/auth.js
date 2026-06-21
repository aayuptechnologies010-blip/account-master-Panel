const router = require('express').Router();
const { verifyFirebaseToken, logout, devLogin, register, login } = require('../controllers/authController');

router.post('/verify-firebase', verifyFirebaseToken);
router.post('/logout', logout);
router.post('/dev-login', devLogin);
router.post('/register', register);
router.post('/login', login);

module.exports = router;

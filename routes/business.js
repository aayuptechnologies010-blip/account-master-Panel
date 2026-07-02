const router = require('express').Router();
const { getBusinessProfile, updateBusinessProfile } = require('../controllers/businessController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, getBusinessProfile);
router.put('/', authMiddleware, updateBusinessProfile);

module.exports = router;

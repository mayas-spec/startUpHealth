const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user.controller');
const {auth,authorize} = require('../middlewares/authMiddleware');


router.get('/profile', auth, authorize('user'), userCtrl.getUserProfile);
router.put('/profile', auth, authorize('user'), userCtrl.updateUserProfile);
router.delete('/account', auth, authorize('user'), userCtrl.deleteAccount);

module.exports = router;

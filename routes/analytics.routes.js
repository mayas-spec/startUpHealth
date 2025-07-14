const express = require('express');
const router = express.Router();
const analyticsCtrl = require('../controllers/analytics.controller');
const { auth, authorize } = require('../middlewares/authMiddleware');


router.get('/overview', auth, authorize('superadmin'), analyticsCtrl.getPlatformAnalytics);
router.get('/facility', auth, authorize('facility_admin'), analyticsCtrl.getFacilityAnalytics);
router.get('/system', auth, authorize('superadmin'), analyticsCtrl.getSystemAnalytics);

module.exports = router;

const express = require('express');
const router = express.Router();
const reviewCtrl = require('../controllers/review.controller');
const { auth, authorize } = require('../middlewares/authMiddleware');
const { validateReview } = require('../middlewares/validation');



router.post('/', auth, authorize('user'), validateReview, reviewCtrl.createReviews);

// Get facility reviews 
router.get('/facility/:facilityId', reviewCtrl.getFacilityReviews);


router.delete('/:id', auth, authorize('user'), reviewCtrl.deleteReview);

module.exports = router;
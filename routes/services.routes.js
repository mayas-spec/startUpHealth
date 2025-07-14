const express = require('express');
const router = express.Router();
const serviceCtrl = require('../controllers/service.controller');
const { auth, authorize } = require('../middlewares/authMiddleware');
const {validateService, validateStockUpdate} = require('../middlewares/validation');

// Facility Admin routes
router.post('/:facilityId/services', auth, authorize('facility_admin'), validateService, serviceCtrl.createService);
router.put('/:id', auth, authorize('facility_admin'), serviceCtrl.updateService);
router.delete('/:id', auth, authorize('facility_admin'), serviceCtrl.deleteService);
router.patch('/:id/stock', auth, authorize('facility_admin'), validateStockUpdate, serviceCtrl.updateStock);

// Get facility services
router.get('/:facilityId/services', auth, serviceCtrl.getAfacilityServices);

// Get low stock services
router.get('/low-stock', auth, serviceCtrl.getLowStock);

// Search services offered by facilities
router.get('/search', serviceCtrl.searchServices);

module.exports = router;
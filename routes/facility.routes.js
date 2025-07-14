const express = require("express");
const router = express.Router();
const facilityCtrl = require("../controllers/facility.controller");
const { auth, authorize } = require("../middlewares/authMiddleware");
const { validateFacility } = require("../middlewares/validation");

// System Admin routes
router.post(
  "/",
  auth,
  authorize("superadmin"),
  validateFacility,
  facilityCtrl.addFacility
);
router.delete(
  "/:id",
  auth,
  authorize("superadmin"),
  facilityCtrl.deactivateFacility
);

// Public routes
router.get("/", facilityCtrl.getAllFacilities);
router.get("/search", facilityCtrl.searchFacilities);
router.get("/nearby", facilityCtrl.getNearbyFacilities);
router.get("/:id", facilityCtrl.getFacilityById);
router.get("/:id/time-slots", facilityCtrl.getAvailableTimeSlots);

// Facility Admin routes
router.get(
  "/admin/dashboard",
  auth,
  authorize("facility_admin"),
  facilityCtrl.getFacilityDashboard
);
router.put(
  "/:id",
  auth,
  authorize("facility_admin"),
  facilityCtrl.updateFacility
);
router.post(
  "/:id/photos",
  auth,
  authorize("facility_admin"),
  facilityCtrl.uploadFacilityPhotos
);

module.exports = router;

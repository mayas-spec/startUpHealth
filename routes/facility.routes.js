const express = require("express");
const router = express.Router();
const facilityCtrl = require("../controllers/facility.controller");
const { auth, authorize } = require("../middlewares/authMiddleware");
const { validateFacility } = require("../middlewares/validation");
const upload = require("../middlewares/upload");

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
  validateFacility,
  facilityCtrl.updateFacility
);

router.post(
  "/:id/photos",
  auth,
  authorize("facility_admin"),
  upload.array("files", 10),
  /* 
    #swagger.tags = ['Facilities']
    #swagger.summary = 'Upload facility photos'
    #swagger.description = 'Upload up to 10 photos for a facility'
    #swagger.consumes = ['multipart/form-data']
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'string',
      description: 'Facility ID'
    }
    #swagger.parameters['files'] = {
      in: 'formData',
      name: 'files',
      type: 'file',
      required: true,
      description: 'Image files to upload (max 10)'
    }
    #swagger.responses[200] = {
      description: 'Photos uploaded successfully'
    }
    #swagger.responses[400] = {
      description: 'Bad request'
    }
    #swagger.responses[401] = {
      description: 'Unauthorized'
    }
    #swagger.responses[403] = {
      description: 'Forbidden'
    }
  */
  facilityCtrl.uploadFacilityPhotos
);

// // / Test route
// router.post("/:id/photos/test", auth, authorize("facility_admin"), upload.array("files", 10), facilityCtrl.testFacilityUpload);


router.get("/:id", facilityCtrl.getFacilityWithServices);

module.exports = router;
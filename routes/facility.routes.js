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
    #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: {
                  type: "string",
                  format: "binary"
                },
                maxItems: 10,
                description: "Upload up to 10 image files"
              }
            }
          }
        }
      }
    }
    #swagger.parameters['id'] = {
      in: 'path',
      required: true,
      type: 'string',
      description: 'Facility ID'
    }
    #swagger.responses[200] = {
      description: 'Photos uploaded successfully'
    }
  */
  facilityCtrl.uploadFacilityPhotos
);

router.get("/:id", facilityCtrl.getFacilityWithServices);

module.exports = router;
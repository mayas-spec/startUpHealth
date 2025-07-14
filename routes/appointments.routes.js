const express = require("express");
const router = express.Router();
const AppointmentCtrl = require("../controllers/appointment.controller");
const { auth, authorize } = require("../middlewares/authMiddleware");
const { validateAppointment } = require("../middlewares/validation");

// Book a new appointment
router.post(
  "/",
  auth,
  authorize("user"),
  validateAppointment,
  AppointmentCtrl.bookAppointment
);

// Get user's appointments
router.get(
  "/:id",
  auth,
  authorize("user"),
  AppointmentCtrl.getUserAppointments
);

// Get facility's appointments
router.get(
  "/facility",
  auth,
  authorize("facility_admin"),
  AppointmentCtrl.getFacilityAppointments
);

// Update appointment status 
router.put(
  "/:id/status",
  auth,
  authorize("facility_admin"),
  AppointmentCtrl.updateAppointmentStatus
);

// Reschedule appointment
router.put(
  "/:id",
  auth,
  authorize("user"),
  validateAppointment,
  AppointmentCtrl.rescheduleAppointment
);

// Cancel appointment 
router.delete(
  "/:id",
  auth,
  authorize("user"),
  AppointmentCtrl.cancelAppointment
);

module.exports = router;

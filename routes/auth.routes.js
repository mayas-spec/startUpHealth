const express = require("express");
const router = express.Router();
const authControl = require("../controllers/auth.controller");
const { validateSignUp, validateLogIn, validatefacilitySignUp } = require("../middlewares/validation");
const { auth, authorize } = require("../middlewares/authMiddleware");


router.post("/signUp", validateSignUp, authControl.SignUp);
router.post("/logIn", validateLogIn, authControl.Login);
router.post("/forgot-password", authControl.sendResetLink);
router.post("/reset-password/:token", authControl.resetPassword);
router.get("/verify-email/:token", authControl.VerifyEmail);
router.post("/resend-verification", authControl.resendVerificationEmail);

// Superadmin creates a facility admin
router.post("/create-facility-admin", auth, authorize("superadmin"), validatefacilitySignUp, authControl.createFacilityAdmin);

module.exports = router;

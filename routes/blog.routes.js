const express = require("express");
const router = express.Router();
const blogCtrl = require("../controllers/blog.controller");
const { auth, authorize } = require("../middlewares/authMiddleware");
const { validateBlog } = require("../middlewares/validation");

router.post(
  "/",
  auth,
  authorize("superadmin"),
  validateBlog,
  blogCtrl.createBlog
);
router.put(
  "/:id",
  auth,
  authorize("superadmin"),
  validateBlog,
  blogCtrl.updateBlog
);
router.delete("/:id", auth, authorize("superadmin"), blogCtrl.deleteBlog);
router.get("/", blogCtrl.getAllBlogs);
router.get("/:id", blogCtrl.getBlogById);

module.exports = router;

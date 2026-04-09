const express = require("express");
const router = express.Router();
const portalController = require("../controllers/portal.controller");
const authMiddleware = require("../middleware/auth.middleware");
const portalAdminMiddleware = require("../middleware/portalAdmin.middleware");

// All routes here are protected by JWT + Portal Admin Role
router.use(authMiddleware);
router.use(portalAdminMiddleware);

router.get("/dashboard", portalController.dashboard);
router.get("/businesses", portalController.businesses);
router.get("/bookings", portalController.bookings);
router.get("/users", portalController.users);
router.put("/users/:id/manage", portalController.manageUser);
router.post("/create-admin", portalController.createAdmin);
router.put("/business/:id/manage", portalController.manageBusiness);

module.exports = router;

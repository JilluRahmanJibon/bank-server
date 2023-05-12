const express = require("express");
const router = express.Router();
const userController = require("../controller/user.controller");
const verifyToken = require("../middlewares/verifyToken");

router.get("/", userController.getUsers);
router.post("/registration", userController.singUp);
router.post("/login", userController.logIn);
router.get("/me", userController.getMe);
router.post('/forgot-password',userController.forgotPassword)
router
    .route("/:id")
    .get(userController.getUserById)
    .delete(userController.deleteUser)
    .patch(userController.updateUser);

router.patch("/change-password/:id", userController.changePassword);

module.exports = router;
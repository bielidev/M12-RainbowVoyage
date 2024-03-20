import { Router } from "express";
import { UserController } from "../controllers/UserController.js";
import { authenticateToken } from "../middlewares/token.js";
import { upload } from "../middlewares/multer.js";

export const createUserRouter = (userModel) => {
  const userRouter = Router();

  const userController = new UserController(userModel);

  userRouter.post("/register", userController.register);
  userRouter.post("/login", userController.login);
  userRouter.get("/", userController.getUser);
  // userRouter.delete("/deactivate", authenticateToken, userController.deactivate);
  // userRouter.post("/activate", userController.activate);
  // userRouter.get("/type/:type", userController.getByType);
  // userRouter.get("/getData", authenticateToken, userController.getData);
  // userRouter.get("/getStats/:userId", userController.getUserStats);
  // userRouter.get("/getStatsAuth", authenticateToken, userController.getUserStatsAuth);
  // userRouter.get("/favorites", authenticateToken, userController.getFavorites);
  // userRouter.put("/favorites", authenticateToken, userController.toggleFavorite);
  // userRouter.put("/favorites/add", authenticateToken, userController.addFavorite);
  // userRouter.get("/ranking", userController.getRanking);
  // userRouter.post("/sendData", authenticateToken, userController.sendData);
  // userRouter.post("/sendPhoto", authenticateToken, upload.single('userPhoto'), userController.sendPhoto);
  // userRouter.post("/userPhoto", authenticateToken, upload.single('userPhoto'), userController.getUserImage);



  return userRouter;
};
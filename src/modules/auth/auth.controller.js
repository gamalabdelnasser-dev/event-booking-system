import { Router } from "express";
import { authentication, validation } from "../../middlewares/index.js";
import { loginSchema, signupSchema } from "./auth.validation.js";
import { login, me, signup } from "./auth.service.js";
import { successResponse } from "../../Common/index.js";

const router = Router();

router.post("/register", validation(signupSchema), async (req, res) => {
  const user = await signup(req.body);
  return successResponse({
    res,
    status: 201,
    message: `Signup successfully`,
    data: { user },
  });
});

router.post("/login", validation(loginSchema), async (req, res) => {
  const credentials = await login(req.body, `${req.protocol}://${req.host}`);
  return successResponse({
    res,
    message: `Login successfully`,
    data: { credentials },
  });
});

router.get("/me", authentication(), async (req, res) => {
  const user = await me(req.user);
  return successResponse({
    res,
    data: { user },
  });
});

export default router;

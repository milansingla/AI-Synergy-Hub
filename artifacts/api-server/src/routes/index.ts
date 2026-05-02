import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jdRouter from "./jd";
import interviewsRouter from "./interviews";
import usersRouter from "./users";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jdRouter);
router.use(interviewsRouter);
router.use(usersRouter);
router.use(adminRouter);

export default router;

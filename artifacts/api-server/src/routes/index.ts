import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jdRouter from "./jd";
import interviewsRouter from "./interviews";
import usersRouter from "./users";
import adminRouter from "./admin";
import facilityRouter from "./facility";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jdRouter);
router.use(interviewsRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(facilityRouter);

export default router;

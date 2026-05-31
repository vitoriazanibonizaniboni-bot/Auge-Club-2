import { Router, type IRouter } from "express";
import healthRouter from "./health";
import isaRouter from "./isa";

const router: IRouter = Router();

router.use(healthRouter);
router.use(isaRouter);

export default router;

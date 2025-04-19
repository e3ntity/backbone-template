import * as config from "@root/config";
import express, { Request, Response } from "express";

const router = express.Router({ mergeParams: true });

router.get("/version", (_req: Request, res: Response) => {
  res.json({ version: config.VERSION });
});

router.post("/auth", require("./auth").default);
router.post("/reauth", require("./reauth").default);

router.use("/user", require("./user").default);
router.use("/verification", require("./verification").default);

export default router;

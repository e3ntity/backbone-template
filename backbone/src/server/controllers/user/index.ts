import { requireAuth } from "@root/server/middlewares";
import express from "express";

const router = express.Router();

router.post("/", require("./create").default);

router.use(requireAuth());
router.get("/", require("./fetch").default);
router.post("/connect-google", require("./connectGoogle").default);
router.post("/update", require("./update").default);
router.post("/update-email", require("./updateEmail").default);
router.post("/update-phone", require("./updatePhone").default);
router.delete("/", require("./delete").default);

router.use("/preference", require("./preference").default);

export default router;

import express from "express";

const router = express.Router();

router.post("/", require("./begin").default);
router.post("/:accessVerificationId", require("./complete").default);

export default router;

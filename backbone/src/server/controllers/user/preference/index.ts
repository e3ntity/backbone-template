import express from "express";

const router = express.Router();

router.get("/:name", require("./load").default);
router.post("/:name", require("./set").default);

export default router;

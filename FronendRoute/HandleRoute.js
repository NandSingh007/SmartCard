const express = require("express");
const { getExample, postExample } = require("../controllers/exampleController");

const router = express.Router();

router.get("/example", getExample);
router.post("/example", postExample);

module.exports = router;

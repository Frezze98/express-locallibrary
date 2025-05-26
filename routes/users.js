const express = require("express");
const router = express.Router();

// Приклад маршруту для користувачів (можна розширити за потреби)
router.get("/", function (req, res) {
  res.send("NOT IMPLEMENTED: Users page");
});

module.exports = router;
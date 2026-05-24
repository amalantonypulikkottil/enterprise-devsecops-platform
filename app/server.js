const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Enterprise DevSecOps Pipeline Running Successfully V4 🚀");
});

app.listen(3000, () => {
  console.log("Application running on port 3000");
});

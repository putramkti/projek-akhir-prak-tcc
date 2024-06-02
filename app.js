const express = require("express");
const cors = require("cors");
const filmRouter = require("./film");
const port = "3100";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/film", filmRouter);

app.get("/", (req, res) => {
  res.send("Halaman film service");
});

app.listen(port, () => {
  console.log("Server Connected on PORT: " + port + "/");
});
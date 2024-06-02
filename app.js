const express = require("express");
const cors = require("cors");
const userRouter = require("./user");
const port = "3100";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("Halaman user service");
});

app.listen(port, () => {
  console.log("Server Connected on PORT: " + port + "/");
});
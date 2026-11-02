
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectToMongo = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "RePlate backend is running" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/donations", require("./routes/donations"));
app.use("/api/trips", require("./routes/trips"));

const startServer = async () => {
  await connectToMongo();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`RePlate backend running on port ${PORT}`);
  });
};

startServer();

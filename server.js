const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const { readdirSync } = require("fs");
require("dotenv").config();
const compression = require('compression')


// app
const app = express();


mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    // useFindAndModify: false,
    useUnifiedTopology: true,
    // useCreateIndex: true,
  })
  .then(() => console.log("DB CONNECTED"))
  .catch((err) => console.log("DB CONNECTION ERR => ", err));



// middlewares
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "2mb", verify: (req, res, buf) => {
  req.rawBody = buf
} 
}));
app.use(cors());


// routes middleware
readdirSync("./routes").map((r) => app.use("/api", require("./routes/" + r)));

// port
const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`Server is running on port ${port}`));

// app.listen(port, '172.20.10.3', () => {
//   console.log(`Server is running on 172.20.10.3:${port}`);
// });

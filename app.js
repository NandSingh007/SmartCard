const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs"); // Add this line
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const {
  Registration,
  Login,
  Identity,
  identityUserData,
  profile,
  Insurance,
  deleteUserData,
  getAllInsuranceData,
  insurancedit,
  checkBackendLogin,
  getProfile,
  loginBackend,
  Firststatus,
  Secondstatus,
  getPaymentStatuses,
  getUserDeatilsData,
  updatecardlimit
} = require("./Controller/Controller");
const { mongodb } = require("./Config/config");
const { default: mongoose } = require("mongoose");
const verifyToken = require("./middleware/verifyToken");
const app = express();
// Static Files
app.use("/static", express.static(path.join(__dirname, "/static")));

// app.use(express.static(path.join(__dirname, "/static")));

app.use(express.static(path.join(__dirname, "layouts")));
// Middleware to parse JSON bodies
app.use(express.json());
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE"], // Allow specific HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"] // Allow specific headers
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Connect to MongoDB
mongoose
  .connect(mongodb, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((error) =>
    console.error("Error connecting to MongoDB:", error.message)
  );

// router for frontend
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // Limit each IP to 100 requests per windowMs
// });
// app.use(limiter);
// Set Templating Engine
app
  .use(expressLayouts)
  .set("view engine", "ejs")
  .set("views", path.join(__dirname, "/content"));

// api handler
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  req.setTimeout(120000, () => {
    console.log("Request timed out");
    res.status(408).json({ error: "Request timed out" });
  });
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const qrCodeFolder = path.join(__dirname, "uploads");

    // Check if folder exists, create it if not
    if (!fs.existsSync(qrCodeFolder)) {
      fs.mkdirSync(qrCodeFolder, { recursive: true });
    }

    cb(null, qrCodeFolder); // Save to 'uploads/qrCodes' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Rename file with timestamp
  }
});

// Initialize Multer Upload Middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 5MB file limit
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|svg|webp/;
    const mimeType = allowedFileTypes.test(file.mimetype);
    const extName = allowedFileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimeType && extName) {
      return cb(null, true);
    }
    cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed!"));
  }
});

// Your Rate Limiter Middleware (if you have one)

// Identity Route
app.post(
  "/identity",
  upload.none(),
  Identity // Your Identity Controller to handle the request and response
);

app.post("/registration", Registration);
app.post("/login", Login); // Assuming limiter is already defined somewhere else
app.post("/update-card-limit", updatecardlimit);
app.post("/Insurance", Insurance);
app.get("/getAllInsuranceData", getAllInsuranceData);
app.put("/insurancedit", insurancedit);
app.get("/getProfile", getProfile);
app.post("/Secondstatus", Secondstatus);
app.get("/identityUserData", identityUserData);
app.post("/Firststatus", Firststatus);
app.get("/getPaymentStatuses/:id", getPaymentStatuses);
app.get("/getUserDeatilsData/:id", getUserDeatilsData);
app.post("/loginBackend", loginBackend);
app.post("/checkBackendLogin", checkBackendLogin);
app.delete("/deleteUserData/:id", deleteUserData);

// Set up multer storage configuration for QR code
// Endpoint to handle profile updates
app.post("/profile", upload.single("QRImg"), profile);
// frontend page
app.get("/", (req, res) => {
  res.render("index", {
    layout: path.join(__dirname, "layouts", "index-2.html"),
    footer: true
  });
});
app.get("/FirstCard", verifyToken, (req, res) => {
  res.render("index", {
    layout: path.join(__dirname, "/layouts/FirstCard"),
    footer: true
  });
});
app.get("/SecondCard", verifyToken, (req, res) => {
  res.render("index", {
    layout: path.join(__dirname, "/layouts/secondcard"),
    footer: true
  });
});

app.get("/ThirdCard", verifyToken, (req, res) => {
  res.render("index", {
    layout: path.join(__dirname, "/layouts/thirdcard"),
    footer: true
  });
});

app.get("/loginAdmin", (req, res) => {
  res.render("index", {
    layout: path.join(__dirname, "/layouts/loginAdmin"),
    footer: true
  });
});

// backend page

app.get("/admin", verifyToken, (req, res) => {
  res.render("index", {
    layout: path.join(__dirname, "/layouts/dashboard"),
    footer: true
  });
});

app.get("/settings", (req, res) => {
  res.render("settings", {
    layout: path.join(__dirname, "/layouts/dashboard"),
    footer: true
  });
});

app.get("/crud/products", verifyToken, (req, res) => {
  const products = require("./data/products.json");
  res.render("crud/products", {
    layout: path.join(__dirname, "/layouts/dashboard"),
    footer: false,
    products
  });
});

app.get("/crud/users", verifyToken, (req, res) => {
  const users = require("./data/users.json");
  res.render("crud/users", {
    layout: path.join(__dirname, "/layouts/dashboard"),
    footer: false,
    users
  });
});
app.get("/crud/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    // Fetch user data from API
    const response = await axios.get(
      `https://smartpaycard.in/getUserDeatilsData/${userId}`
    );
    // console.log(response.data);
    const user = response.data.userData;

    // Render the page with user data or null
    res.render("crud/user", {
      layout: path.join(__dirname, "/layouts/dashboard"),
      footer: false,
      user // Pass user data (null if no data is found)
    });
  } catch (error) {
    console.error("Error fetching user:", error);

    // Handle error scenario
    res.status(500).send("Failed to load user data");
  }
});

app.get("/crud/firstpay", verifyToken, (req, res) => {
  const products = require("./data/products.json");
  res.render("crud/FirstPay", {
    layout: path.join(__dirname, "/layouts/dashboard"),
    footer: false,
    products
  });
});
app.get("/crud/secondpay", verifyToken, (req, res) => {
  const products = require("./data/products.json");
  res.render("crud/SecondPay", {
    layout: path.join(__dirname, "/layouts/dashboard"),
    footer: false,
    products
  });
});

app.get("/company/insurance", verifyToken, (req, res) => {
  res.render("company/insurance", {
    layout: path.join(__dirname, "/layouts/dashboard"),
    footer: true
  });
});

app.get("/company/profile", verifyToken, (req, res) => {
  res.render("company/profile", {
    layout: path.join(__dirname, "/layouts/dashboard"),
    footer: true
  });
});

const server = app.listen(3001, () => {
  console.log("Server running on port 3001");
});
server.timeout = 120000; // 120 seconds

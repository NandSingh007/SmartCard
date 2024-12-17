const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.cookies ? req.cookies.authToken : null; // Check for 'authToken' cookie
  console.log(token, "token");

  if (!token) {
    console.log("No token found, redirecting...");
    return res.redirect("/loginAdmin"); // Redirect to /admin if no token
  }

  // Use the same secret used for signing the JWT token
  const jwtSecret = "hi" || "your-secret-key"; // Get the secret from environment variables or use a fallback

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.log("Invalid token, redirecting...");
      return res.redirect("/loginAdmin"); // Redirect to login if token is invalid
    }

    // Attach the decoded token to the request object
    req.user = decoded;
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = verifyToken;

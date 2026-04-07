const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const header = req.headers.authorization;
  const queryToken = req.query?.token;

  if (!header && !queryToken) {
    return res.status(401).json({ message: "No token" });
  }

  const token = header
    ? (header.startsWith("Bearer ") ? header.slice(7) : header)
    : queryToken;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

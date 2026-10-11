const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  // 1. Header se Authorization nikalna
  const authHeader = req.headers.authorization;

  // 2. Check karo ki header hai ya nahi aur Bearer se start hota hai ya nahi
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // 3. Token nikalna (Bearer ke baad wala hissa)
  const token = authHeader.split(' ')[1];

  try {
    // 4. Token verify karna
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 5. req.user mein info daalna
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    // 6. Aage badhne dena
    next();
  } catch (err) {
    // 7. Agar token expire ya invalid hai
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired' });
    }
    return res.status(401).json({ error: 'Invalid access token' });
  }
};

module.exports = { authenticate };
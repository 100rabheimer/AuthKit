// Signup validation middleware
const validateSignup = (req, res, next) => {
  const { email, password, name } = req.body;

  // 1. Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  // 2. Simple email format check
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email',
    });
  }

  // 3. Password minimum length check
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  // 4. Name check
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required',
    });
  }

  // Sab theek hai to aage badho
  next();
};

// Login validation middleware
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  // 2. Simple email format check
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email',
    });
  }

  // Sab theek hai to aage badho
  next();
};

module.exports = { validateSignup, validateLogin };
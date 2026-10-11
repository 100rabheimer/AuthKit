const pool = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/tokens');

const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if email already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const newUser = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [email, hashedPassword, name]
    );

    const user = newUser.rows[0];

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Hash refresh token and save
    const refreshTokenHash = hashToken(refreshToken);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshTokenHash]
    );

    // Set cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send response
    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const login = async (req, res) => {
  try {
    // 1. Input
    const { email, password } = req.body;

    // 2. Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

   // 3. User dhoondho
const result = await pool.query(
  'SELECT id, email, name, password_hash FROM users WHERE email = $1',
  [email]
);

const user = result.rows[0];

// Dummy hash (timing attack prevent karne ke liye)
const hashToCompare = user
  ? user.password_hash
  : '$2b$12$invalidhashfortimingattackpreventionxxxxxxxxxxxx';

// 4. Password check (hamesha bcrypt chalega)
const isMatch = await comparePassword(password, hashToCompare);

if (!user || !isMatch) {
  return res.status(401).json({ error: 'Invalid credentials' });
}
    // 5. Tokens banao
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 6. Refresh token hash karke save karo
    const refreshTokenHash = hashToken(refreshToken);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, refreshTokenHash]
    );

    // 7. Cookie set karo
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // 8. Response
    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const refresh = async (req, res) => {
  try {
    // 1. Cookie se refresh token nikalo
    const oldRefreshToken = req.cookies.refreshToken;

    // 2. Validation
    if (!oldRefreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // 3. Token hash karke DB mein dhoondho
    const oldTokenHash = hashToken(oldRefreshToken);

    const tokenResult = await pool.query(
      `SELECT * FROM refresh_tokens 
       WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
      [oldTokenHash]
    );
// ! Agar koi purana/revoked token use kare to aap sirf 401 de rahe ho, Attacker detect nahi hota aur baaki sessions safe rehte hain
    // if (tokenResult.rows.length === 0) {
    //   return res.status(401).json({ error: 'Invalid or expired refresh token' });
    // }

    // ! Pehle normal valid token dhoondho, Agar nahi mila → check karo ki yeh token kabhi exist karta tha (reuse detection),  Agar haan → us user ke saare refresh tokens revoke kar do
   if (tokenResult.rows.length === 0) {
  // Reuse detection
  const possibleReuse = await pool.query(
    'SELECT user_id FROM refresh_tokens WHERE token_hash = $1',
    [oldTokenHash]
  );

  if (possibleReuse.rows.length > 0) {
    // Token pehle use ho chuka hai → saare sessions revoke kar do
    await pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE user_id = $1',
      [possibleReuse.rows[0].user_id]
    );
  }

  return res.status(401).json({ error: 'Invalid or expired refresh token' });
}

    const storedToken = tokenResult.rows[0];

    // 4. Purana token revoke karo (Token Rotation)
    await pool.query(
      'UPDATE refresh_tokens SET revoked = true WHERE id = $1',
      [storedToken.id]
    );

    // 5. User ki details nikalo
    const userResult = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [storedToken.user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // 6. Naye tokens banao
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // 7. Naya refresh token hash karke save karo
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, newRefreshTokenHash]
    );

    // 8. Nayi cookie set karo
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // 9. Response
    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);

      await pool.query(
        'UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1',
        [tokenHash]
      );
    }

    // Yahan galat tha → clearCookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'          // samesite nahi, sameSite
    });

    res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
const me = async (req, res) => {
  try {
    // 1. req.user middleware ne already set kar diya hai
    //    isliye hum seedha req.user.id use kar sakte hain

    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    // 2. Agar user nahi mila (rare case)
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. User ki details bhej do (password nahi)
    res.status(200).json({
      user: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  me
};
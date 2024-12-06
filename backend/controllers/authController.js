const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail } = require('../models/userModel');
const db = require('../models/db');
require('dotenv').config();

// ลงทะเบียนผู้ใช้
exports.register = async (req, res) => {
  const { username, email, password, isAdmin } = req.body;

  // ตรวจสอบข้อมูลที่ได้รับจาก request
  console.log('Request body:', req.body);

  try {
    // เพิ่มการตรวจสอบความถูกต้องของข้อมูล
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // ตรวจสอบรูปแบบอีเมล
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(username, email, hashedPassword, isAdmin || false);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// เข้าสู่ระบบ
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // เพิ่มการตรวจสอบความถูกต้องของข้อมูล
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({
      message: user.isAdmin ? 'Admin login successful' : 'User login successful',
      token,
      role: user.isAdmin ? 'admin' : 'user',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    console.log('Getting user details for ID:', req.user.id);

    const [rows] = await db.execute(
      'SELECT id, username, email, isAdmin, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    console.log('Query result:', rows);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.isAdmin ? 'Admin' : 'User',
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      message: 'Error fetching user details',
      error: error.message 
    });
  }
};

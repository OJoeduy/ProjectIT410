const db = require('./db');

const createUser = async (username, email, hashedPassword, isAdmin = false) => {
  const [result] = await db.execute(
    'INSERT INTO users (username, email, password, isAdmin) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, isAdmin]
  );
  return result;
};

const getUserByEmail = async (email) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

module.exports = { createUser, getUserByEmail };

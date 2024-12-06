const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authenticateToken = require('./controllers/authMiddleware');
const db = require('./models/db');

const app = express();

app.use(cors({
  origin: 'http://localhost:4200', // Angular dev server
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

app.use('/api/auth',authRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/users', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }

  try {
    const [results] = await db.execute(
      'SELECT id, username, email, isAdmin as role FROM users'
    );
    const users = results.map(user => ({
      ...user,
      role: user.role ? 'admin' : 'user'
    }));
    res.status(200).json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { id } = req.params;
  const { username, email, role } = req.body;

  try {
    await db.execute(
      'UPDATE users SET username = ?, email = ?, isAdmin = ? WHERE id = ?',
      [username, email, role === 'admin', id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// Update user role
app.patch('/api/users/:id/role', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { id } = req.params;
  const { role } = req.body;

  try {
    await db.execute(
      'UPDATE users SET isAdmin = ? WHERE id = ?',
      [role === 'admin', id]
    );
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Delete user
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { id } = req.params;

  try {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get available rooms
app.get('/api/rooms/available', authenticateToken, async (req, res) => {
  try {
    const [rooms] = await db.execute(
      'SELECT * FROM rooms WHERE status = "available" ORDER BY room_number'
    );
    res.json({ data: rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms' });
  }
});

// Check room availability for specific date and time
app.get('/api/rooms/check-availability', authenticateToken, async (req, res) => {
  const { date, time_slot } = req.query;
  try {
    const [bookings] = await db.execute(
      `SELECT room_number FROM bookings 
       WHERE booking_date = ? AND time_slot = ?`,
      [date, time_slot]
    );
    
    const bookedRooms = bookings.map(b => b.room_number);
    
    const [rooms] = await db.execute(
      `SELECT * FROM rooms 
       WHERE status = 'available' 
       AND room_number NOT IN (?)`,
      [bookedRooms.length ? bookedRooms : ['none']]
    );
    
    res.json({ data: rooms });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Error checking room availability' });
  }
});

const PORT = 8085;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const db = require('./db');

// เพิ่มการจอง
const createBooking = async (name, booking_date, room_number, status) => {
  const [result] = await db.execute(
    'INSERT INTO bookings (name, booking_date, room_number, status) VALUES (?, ?, ?, ?)',
    [name, booking_date, room_number, status]
  );
  return result.insertId;
};

// ดึงข้อมูลการจองทั้งหมด
const getAllBookings = async () => {
  try {
    const [rows] = await db.execute('SELECT * FROM bookings');
    return rows;
  } catch (error) {
    throw error;
  }
};

// อัปเดตข้อมูลการจอง
const updateBooking = async (id, name, booking_date, room_number, status) => {
  await db.execute(
    'UPDATE bookings SET name = ?, booking_date = ?, room_number = ?, status = ? WHERE id = ?',
    [name, booking_date, room_number, status, id]
  );
};

// ลบการจอง
const deleteBooking = async (id) => {
  await db.execute('DELETE FROM bookings WHERE id = ?', [id]);
};

const updateBookingStatus = async (id, status) => {
  try {
    const [result] = await db.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  updateBooking,
  deleteBooking,
  updateBookingStatus,
};

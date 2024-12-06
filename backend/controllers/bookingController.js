const {
    createBooking,
    getAllBookings,
    updateBooking,
    deleteBooking,
  } = require('../models/bookingModel');
const db = require('../models/db');
  
  exports.getAllBookings = async (req, res) => {
    try {
      const userId = req.user.id;
      let query = 'SELECT * FROM bookings';
      let params = [];

      // ถ้าไม่ใช่ admin ให้ดึงเฉพาะข้อมูลของ user นั้น
      if (!req.user.isAdmin) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }

      // เรียงลำดับตามวันที่จองและ ID จากเก่าไปใหม่
      query += ' ORDER BY booking_date ASC, id ASC';

      const [bookings] = await db.execute(query, params);
      
      res.status(200).json({ 
        message: 'Bookings fetched successfully',
        data: bookings 
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ 
        message: 'Error fetching bookings',
        error: error.message 
      });
    }
  };
  
  exports.addBooking = async (req, res) => {
    try {
      const { name, booking_date, time_slot, room_number } = req.body;
      const userId = req.user.id;

      console.log('Received booking request:', {
        name,
        booking_date,
        time_slot,
        room_number,
        userId
      });

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!name || !booking_date || !time_slot || !room_number) {
        return res.status(400).json({ 
          message: 'All fields are required',
          received: { name, booking_date, time_slot, room_number }
        });
      }

      // ตรวจสอบการจองซ้ำ
      const [existingBookings] = await db.execute(
        'SELECT id FROM bookings WHERE booking_date = ? AND time_slot = ? AND room_number = ?',
        [booking_date, time_slot, room_number]
      );

      if (existingBookings && existingBookings.length > 0) {
        return res.status(400).json({ 
          message: 'This room is already booked for the selected time slot' 
        });
      }

      // ตรวจสอบว่าห้องว่างไหม
      const [roomAvailable] = await db.execute(
        `SELECT r.room_number 
         FROM rooms r 
         LEFT JOIN bookings b ON r.room_number = b.room_number 
         AND b.booking_date = ? AND b.time_slot = ?
         WHERE r.room_number = ? AND r.status = 'available' 
         AND b.id IS NULL`,
        [booking_date, time_slot, room_number]
      );

      if (!roomAvailable || roomAvailable.length === 0) {
        return res.status(400).json({ 
          message: 'Room is not available for the selected time slot' 
        });
      }

      // เพิ่มการจองใหม่
      const [result] = await db.execute(
        'INSERT INTO bookings (name, booking_date, time_slot, room_number, status, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name, booking_date, time_slot, room_number, 'pending', userId]
      );

      res.status(201).json({ 
        message: 'Booking added successfully',
        id: result.insertId,
        booking: {
          id: result.insertId,
          name,
          booking_date,
          time_slot,
          room_number,
          status: 'pending',
          user_id: userId
        }
      });

    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ 
        message: 'Error adding booking',
        error: error.message 
      });
    }
  };
  
  exports.updateBooking = async (req, res) => {
    const { id } = req.params;
    const { name, booking_date, room_number, status } = req.body;
  
    if (!name || !booking_date || !room_number || !status) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      await updateBooking(id, name, booking_date, room_number, status);
      res.status(200).json({ message: 'Booking updated successfully' });
    } catch (error) {
      console.error('Error updating booking:', error.message);
      res.status(500).json({ message: 'Error updating booking' });
    }
  };
  
  exports.deleteBooking = async (req, res) => {
    const { id } = req.params;
  
    try {
      await deleteBooking(id);
      res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
      console.error('Error deleting booking:', error.message);
      res.status(500).json({ message: 'Error deleting booking' });
    }
  };
  
  exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Debug log
    console.log('Received update request:', {
      id,
      status,
      body: req.body
    });

    // ตรวจสอบค่า status
    const validStatuses = ['pending', 'approved', 'rejected'];
    const normalizedStatus = status.toLowerCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        message: 'Invalid status value',
        received: status,
        allowedValues: validStatuses
      });
    }

    try {
      const [result] = await db.execute(
        'UPDATE bookings SET status = ? WHERE id = ?',
        [normalizedStatus, id]
      );

      console.log('Update result:', result);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      res.status(200).json({
        message: 'Status updated successfully',
        bookingId: id,
        newStatus: normalizedStatus
      });
    } catch (error) {
      console.error('Database error:', {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sql: error.sql
      });

      res.status(500).json({
        message: 'Failed to update status',
        error: error.message
      });
    }
  };
  
  exports.getUserBookings = async (req, res) => {
    try {
      const userId = req.user.id;

      const [bookings] = await db.execute(
        'SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_date ASC, id ASC',
        [userId]
      );

      res.status(200).json({ 
        message: 'Bookings fetched successfully',
        data: bookings 
      });
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      res.status(500).json({ message: 'Error fetching bookings' });
    }
  };
  
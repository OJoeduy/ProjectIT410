const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authenticateToken = require('../controllers/authMiddleware');

// เพิ่ม route สำหรับดึงการจองของ user
router.get('/user', authenticateToken, bookingController.getUserBookings);

router.get('/', authenticateToken, bookingController.getAllBookings);
router.post('/', authenticateToken, bookingController.addBooking);
router.put('/:id', authenticateToken, bookingController.updateBooking);
router.delete('/:id', authenticateToken, bookingController.deleteBooking);
router.put('/:id/status', authenticateToken, bookingController.updateBookingStatus);

module.exports = router;

const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Facility = require('../models/facility');
const Service = require('../models/services');
const { sendEmail } = require('../services/email');


const _validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const _isValidTimeSlot = (timeSlot) => {
  if (!timeSlot || !timeSlot.start || !timeSlot.end) return false;
  return new Date(timeSlot.end) > new Date(timeSlot.start);
};

const validateAppointmentInput = (data) => {
  const { facility, service, appointmentDate, timeSlot, reason } = data;
  
  // Check required fields
  if (!facility || !service || !appointmentDate || !timeSlot || !reason) {
    return {
      isValid: false,
      message: 'All fields are required: facility, service, appointmentDate, timeSlot, reason'
    };
  }

  // Validate ObjectIds
  if (!_validateObjectId(facility) || !_validateObjectId(service)) {
    return {
      isValid: false,
      message: 'Invalid facility or service ID format'
    };
  }

  // Validate time slot
  if (!_isValidTimeSlot(timeSlot)) {
    return {
      isValid: false,
      message: 'Invalid time slot: end time must be after start time'
    };
  }

  // Validate reason length
  if (reason.trim().length < 5 || reason.trim().length > 500) {
    return {
      isValid: false,
      message: 'Reason must be between 5 and 500 characters'
    };
  }

  return { isValid: true };
};

const validateRescheduleInput = (data) => {
  const { appointmentDate, timeSlot } = data;
  
  // Check required fields
  if (!appointmentDate || !timeSlot) {
    return {
      isValid: false,
      message: 'appointmentDate and timeSlot are required'
    };
  }

  // Validate time slot
  if (!_isValidTimeSlot(timeSlot)) {
    return {
      isValid: false,
      message: 'Invalid time slot: end time must be after start time'
    };
  }

  return { isValid: true };
};

const validateAppointmentDate = (appointmentDate) => {
  const selectedDate = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return {
      isValid: false,
      message: 'Appointment date must be in the future'
    };
  }

  return { isValid: true, date: selectedDate };
};

const checkUserPendingAppointments = async (userId) => {
  const userPendingCount = await Appointment.countDocuments({
    user: userId,
    status: { $in: ['pending', 'confirmed'] }
  });

  if (userPendingCount >= 5) {
    return {
      isValid: false,
      message: 'You have too many pending appointments. Please complete or cancel existing ones.'
    };
  }

  return { isValid: true };
};

const validateFacilityAndService = async (facilityId, serviceId) => {
  // Check if facility exists and is active
  const facilityDoc = await Facility.findById(facilityId);
  if (!facilityDoc || facilityDoc.status !== 'active') {
    return {
      isValid: false,
      message: 'Facility not found or inactive'
    };
  }

  // Check if service exists and belongs to the facility
  const serviceDoc = await Service.findById(serviceId);
  if (!serviceDoc || serviceDoc.facility.toString() !== facilityId) {
    return {
      isValid: false,
      message: 'Service not found or does not belong to this facility'
    };
  }

  // Check if service is available (in stock)
  if (serviceDoc.stockStatus === 'out_of_stock') {
    return {
      isValid: false,
      message: 'Service is currently out of stock'
    };
  }

  return { isValid: true, facility: facilityDoc, service: serviceDoc };
};

const checkTimeSlotAvailability = async (facilityId, appointmentDate, timeSlot, excludeId = null) => {
  const query = {
    facility: facilityId,
    appointmentDate: appointmentDate,
    'timeSlot.start': timeSlot.start,
    'timeSlot.end': timeSlot.end,
    status: { $in: ['pending', 'confirmed'] }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingAppointment = await Appointment.findOne(query);

  if (existingAppointment) {
    return {
      isAvailable: false,
      message: 'Time slot is already booked'
    };
  }

  return { isAvailable: true };
};

const checkUserTimeConflict = async (userId, appointmentDate, timeSlot, excludeId = null) => {
  const query = {
    user: userId,
    appointmentDate: appointmentDate,
    'timeSlot.start': timeSlot.start,
    'timeSlot.end': timeSlot.end,
    status: { $in: ['pending', 'confirmed'] }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const userConflict = await Appointment.findOne(query);

  if (userConflict) {
    return {
      hasConflict: true,
      message: 'You already have an appointment at this time'
    };
  }

  return { hasConflict: false };
};

const sendAppointmentEmail = async (type, appointment) => {
  const emailTemplates = {
    booking: {
      subject: 'Appointment Booking Confirmation',
      title: 'Appointment Confirmed',
      message: 'Your appointment has been successfully booked:'
    },
    reschedule: {
      subject: 'Appointment Rescheduled',
      title: 'Appointment Rescheduled',
      message: 'Your appointment has been successfully rescheduled:'
    },
    cancellation: {
      subject: 'Appointment Cancelled',
      title: 'Appointment Cancelled',
      message: 'Your appointment has been cancelled:'
    }
  };

  const template = emailTemplates[type];
  if (!template) return;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${template.title}</h2>
      <p>Dear ${appointment.user.name},</p>
      <p>${template.message}</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Appointment ID:</strong> ${appointment._id}</p>
        <p><strong>Facility:</strong> ${appointment.facility.name}</p>
        <p><strong>Service:</strong> ${appointment.service.name}</p>
        <p><strong>Date:</strong> ${appointment.appointmentDate.toDateString()}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot.start} - ${appointment.timeSlot.end}</p>
        ${type === 'booking' ? `<p><strong>Reason:</strong> ${appointment.reason}</p>` : ''}
      </div>
      <p style="color: #666;">Please arrive 15 minutes early for your appointment.</p>
      ${type === 'cancellation' ? 
        '<p style="color: #666;">You can book a new appointment anytime through our platform.</p>' : 
        '<p style="color: #666;">If you need to reschedule or cancel, please contact us.</p>'
      }
    </div>
  `;

  try {
    await sendEmail({
      to: appointment.user.email,
      subject: template.subject,
      html: emailHtml
    });
  } catch (emailError) {
    console.error('Email failed:', emailError.message);
  }
};

const sendStatusUpdateEmail = async (appointment, status) => {
  const statusMessages = {
    confirmed: 'Your appointment has been confirmed',
    completed: 'Your appointment has been marked as completed',
    cancelled: 'Your appointment has been cancelled by the facility'
  };

  const message = statusMessages[status];
  if (!message) return;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Appointment Status Updated</h2>
      <p>Dear ${appointment.user.name},</p>
      <p>${message}.</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Appointment ID:</strong> ${appointment._id}</p>
        <p><strong>Facility:</strong> ${appointment.facility.name}</p>
        <p><strong>Service:</strong> ${appointment.service.name}</p>
        <p><strong>Date:</strong> ${appointment.appointmentDate.toDateString()}</p>
        <p><strong>Time:</strong> ${appointment.timeSlot.start} - ${appointment.timeSlot.end}</p>
        <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
      </div>
      ${status === 'cancelled' ? '<p style="color: #666;">You can book a new appointment anytime through our platform.</p>' : ''}
    </div>
  `;

  try {
    await sendEmail({
      to: appointment.user.email,
      subject: `Appointment Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: emailHtml
    });
  } catch (emailError) {
    console.error('Email failed:', emailError.message);
  }
};

const validatePaginationParams = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
    return {
      isValid: false,
      message: 'Invalid pagination parameters'
    };
  }

  return { isValid: true, pageNum, limitNum };
};

const logRequest = (req) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - User: ${req.user.id}`);
};

// Main Controller Functions
const bookAppointment = async (req, res) => {
  try {
    logRequest(req);
    
    const { facility, service, appointmentDate, timeSlot, reason } = req.body;
    const userId = req.user.id;

    // Validate input
    const inputValidation = validateAppointmentInput(req.body);
    if (!inputValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: inputValidation.message
      });
    }

    // Check user's pending appointments
    const pendingCheck = await checkUserPendingAppointments(userId);
    if (!pendingCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: pendingCheck.message
      });
    }

    // Validate facility and service
    const facilityServiceValidation = await validateFacilityAndService(facility, service);
    if (!facilityServiceValidation.isValid) {
      return res.status(404).json({
        success: false,
        message: facilityServiceValidation.message
      });
    }

    // Validate appointment date
    const dateValidation = validateAppointmentDate(appointmentDate);
    if (!dateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message
      });
    }

    // Check time slot availability
    const availabilityCheck = await checkTimeSlotAvailability(facility, dateValidation.date, timeSlot);
    if (!availabilityCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message: availabilityCheck.message
      });
    }

    // Check user time conflict
    const conflictCheck = await checkUserTimeConflict(userId, dateValidation.date, timeSlot);
    if (conflictCheck.hasConflict) {
      return res.status(400).json({
        success: false,
        message: conflictCheck.message
      });
    }

    // Create appointment
    const appointment = new Appointment({
      user: userId,
      facility,
      service,
      appointmentDate: dateValidation.date,
      timeSlot: {
        start: timeSlot.start,
        end: timeSlot.end
      },
      reason: reason.trim(),
      status: 'pending'
    });

    await appointment.save();

    // Populate appointment with related data
    await appointment.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'facility', select: 'name type location contactInfo' },
      { path: 'service', select: 'name category price' }
    ]);

    // Send confirmation email
    await sendAppointmentEmail('booking', appointment);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    logRequest(req);
    
    const { id } = req.params;
    const { appointmentDate, timeSlot } = req.body;
    const userId = req.user.id;

    // Validate appointment ID
    if (!_validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    // Validate input
    const inputValidation = validateRescheduleInput(req.body);
    if (!inputValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: inputValidation.message
      });
    }

    // Find appointment
    const appointment = await Appointment.findOne({ 
      _id: id, 
      user: userId 
    }).populate('facility service');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be rescheduled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule completed or cancelled appointment'
      });
    }

    // Validate new appointment date
    const dateValidation = validateAppointmentDate(appointmentDate);
    if (!dateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.message
      });
    }

    // Check new time slot availability
    const availabilityCheck = await checkTimeSlotAvailability(
      appointment.facility._id, 
      dateValidation.date, 
      timeSlot, 
      id
    );
    if (!availabilityCheck.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'New time slot is already booked'
      });
    }

    // Update appointment
    appointment.appointmentDate = dateValidation.date;
    appointment.timeSlot = {
      start: timeSlot.start,
      end: timeSlot.end
    };
    appointment.status = 'pending';

    await appointment.save();

    // Populate updated appointment
    await appointment.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'facility', select: 'name type location contactInfo' },
      { path: 'service', select: 'name category price' }
    ]);

    // Send reschedule confirmation email
    await sendAppointmentEmail('reschedule', appointment);

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error rescheduling appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    logRequest(req);
    
    const { id } = req.params;
    const userId = req.user.id;

    // Validate appointment ID
    if (!_validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    // Find appointment
    const appointment = await Appointment.findOne({ 
      _id: id, 
      user: userId 
    }).populate('facility service user');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or already cancelled appointment'
      });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();

    // Send cancellation confirmation email
    await sendAppointmentEmail('cancellation', appointment);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

const getUserAppointments = async (req, res) => {
  try {
    logRequest(req);
    
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Validate pagination parameters
    const paginationValidation = validatePaginationParams(page, limit);
    if (!paginationValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: paginationValidation.message
      });
    }

    const { pageNum, limitNum } = paginationValidation;

    // Build filter
    let filter = { user: userId };
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled'
        });
      }
      filter.status = status;
    }

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Get appointments with pagination
    const appointments = await Appointment.find(filter)
      .populate('facility', 'name type location contactInfo')
      .populate('service', 'name category price')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalAppointments = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalAppointments / limitNum),
          totalAppointments,
          hasNext: skip + appointments.length < totalAppointments,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

const getFacilityAppointments = async (req, res) => {
  try {
    logRequest(req);
    
    const facilityId = req.user.facilityId;
    const { status, date, page = 1, limit = 10 } = req.query;

    // Validate pagination parameters
    const paginationValidation = validatePaginationParams(page, limit);
    if (!paginationValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: paginationValidation.message
      });
    }

    const { pageNum, limitNum } = paginationValidation;

    // Build filter
    let filter = { facility: facilityId };
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled'
        });
      }
      filter.status = status;
    }
    if (date) {
      const selectedDate = new Date(date);
      if (isNaN(selectedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.appointmentDate = {
        $gte: selectedDate,
        $lt: nextDay
      };
    }

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Get appointments with pagination
    const appointments = await Appointment.find(filter)
      .populate('user', 'name email phone')
      .populate('service', 'name category price')
      .sort({ appointmentDate: 1, 'timeSlot.start': 1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalAppointments = await Appointment.countDocuments(filter);

    // Get appointment statistics
    const stats = await Appointment.aggregate([
      { $match: { facility: facilityId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        appointments,
        stats: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalAppointments / limitNum),
          totalAppointments,
          hasNext: skip + appointments.length < totalAppointments,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching facility appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching facility appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    logRequest(req);
    
    const { id } = req.params;
    const { status } = req.body;
    const facilityId = req.user.facilityId;

    // Validate appointment ID
    if (!_validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled'
      });
    }

    // Find appointment
    const appointment = await Appointment.findOne({ 
      _id: id, 
      facility: facilityId 
    }).populate('user facility service');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update appointment status
    appointment.status = status;
    await appointment.save();

    // Send status update email to user
    await sendStatusUpdateEmail(appointment, status);

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

module.exports = {
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  getUserAppointments,
  getFacilityAppointments,
  updateAppointmentStatus
};
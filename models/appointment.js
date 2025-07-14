const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    }
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
}, {
  timestamps: true
});

// Simple validation to check if end time is after start time
appointmentSchema.pre('save', function(next) {
  const [startHour, startMin] = this.timeSlot.start.split(':');
  const [endHour, endMin] = this.timeSlot.end.split(':');
  
  const startTotal = parseInt(startHour) * 60 + parseInt(startMin);
  const endTotal = parseInt(endHour) * 60 + parseInt(endMin);
  
  if (startTotal >= endTotal) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);

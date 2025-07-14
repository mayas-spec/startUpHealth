const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['hospital', 'pharmacy'],
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  hours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  images: [{
    url: String,
    public_id: String
  }],
  description: String,
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  // admin: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true
  // },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});
// Index for geolocation queries
facilitySchema.index({ "location.coordinates": "2dsphere" });
// Method to check if facility is currently open
facilitySchema.methods.isCurrentlyOpen = function() {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const todayHours = this.hours[dayName];
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return false;
  }
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

module.exports = mongoose.model('Facility', facilitySchema);

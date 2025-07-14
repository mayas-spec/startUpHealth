const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure one review per user per facility
reviewSchema.index({ user: 1, facility: 1 }, { unique: true });
// Update facility rating when review is saved
reviewSchema.post('save', async function() {
  const Facility = mongoose.model('Facility');
  
  // Calculate new average rating
  const stats = await this.constructor.aggregate([
    { $match: { facility: this.facility, isActive: true } },
    { $group: { 
        _id: '$facility', 
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Facility.findByIdAndUpdate(this.facility, {
      'rating.average': Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
      'rating.count': stats[0].reviewCount
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);

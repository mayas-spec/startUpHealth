const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['medication', 'vaccine', 'test'],
    required: true
  },
  description: String,
  category: String,
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  stock: {
    status: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'low_stock'],
      default: 'in_stock'
    },
    quantity: {
      type: Number,
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  price: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'GHS'
    }
  },
  images: [{
    url: String,
    public_id: String
  }],
  requiresAppointment: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
// Update stock status based on quantity
serviceSchema.pre('save', function(next) {
  if (this.stock.quantity === 0) {
    this.stock.status = 'out_of_stock';
  } else if (this.stock.quantity <= this.stock.lowStockThreshold) {
    this.stock.status = 'low_stock';
  } else {
    this.stock.status = 'in_stock';
  }
  
  // Update lastUpdated when stock changes
  if (this.isModified('stock.quantity')) {
    this.stock.lastUpdated = new Date();
  }
  
  next();
});

// Index for efficient queries
serviceSchema.index({ facility: 1, type: 1 });
serviceSchema.index({ 'stock.status': 1 });

module.exports = mongoose.model('Service', serviceSchema);

const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 200
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['health_education', 'emergency_preparedness', 'general']
  },
  tags: [String],
  featuredImage: {
    url: String,
    public_id: String
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  publishedAt: Date,
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-set publishedAt when status changes to published
blogSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});


module.exports = mongoose.model('Blog', blogSchema);

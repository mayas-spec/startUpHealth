const Review = require('../models/reviews'); 

const createReviews = async (req, res) => {
  try {
    const review = await Review.create({
      ...req.body,
      user: req.user.id 
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFacilityReviews = async (req, res) => {
  try {
    const allFacilityReviews = await Review.find({
      facility: req.params.facilityId,
      isActive: true 
    })
      .populate('user', 'fullName') 
      .sort({ createdAt: -1 }); 
    
    res.status(200).json(allFacilityReviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    review.isActive = false;
    await review.save();
    
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createReviews,
  getFacilityReviews,
  deleteReview
};
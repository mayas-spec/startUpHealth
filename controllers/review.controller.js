const Review = require('../models/reviews'); 

const createReviews = async (req, res) => {
  try {
    // Destructure the allowed fields from req.body
    const { rating, comment, facility } = req.body;

    // Construct the review object
    const reviewData = {
      rating,
      comment,
      facility,
      user: req.user.id, 
    };

    // Create the review
    const review = await Review.create(reviewData);

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
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
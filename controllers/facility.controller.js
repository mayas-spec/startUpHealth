const Facility = require('../models/facility');

const addFacility = async (req, res) => {
  try {
    const { name, type, location, contact } = req.body;

    if (!name || !type || !location || !location.address || !location.city || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Name, type,location (address and city and contact) are required',
      });
    }

    const newFacility = await Facility.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Facility created successfully',
      data: newFacility,
    });
  } catch (error) {
    console.error('Error creating facility:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deactivateFacility = async (req, res) => {
  try {
    const updatedFacility = await Facility.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!updatedFacility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Facility deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getAllFacilities = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));

    const facilities = await Facility.find()
  .populate("services", "name description") 
  .limit(limitNum)
  .skip((pageNum - 1) * limitNum)
  .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Facility.countDocuments({ isActive: true });

    // Debugging: Log the query and results
    console.log("Facilities Query:", { isActive: true });
    console.log("Facilities Found:", facilities.length);

    // Respond with facilities and pagination metadata
    res.status(200).json({
      success: true,
      data: facilities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching facilities:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateFacility = async (req, res) => {
  try {
    const { name, type, location, contact } = req.body;

    if (name && typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Name must be a string',
      });
    }

    if (type && !['hospital', 'pharmacy'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either hospital or pharmacy',
      });
    }
    if (location) {
      if (!location.address || !location.city) {
        return res.status(400).json({
          success: false,
          message: 'Location must include address and city',
        });
      }
    }
    
    if (contact) {
      if (!contact.phone || typeof contact.phone !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Contact must include a valid phone number',
        });
      }
    }

    const updated = await Facility.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Facility updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id)
    .populate({
      path:'admin',
      select: 'fullName email',
      strictPopulate: false
    })
      .populate('services', 'name description price');
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }

    // Add current status
    const facilityData = facility.toObject();
    facilityData.isCurrentlyOpen = facility.isCurrentlyOpen();

    res.status(200).json({
      success: true,
      data: facilityData
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const searchFacilities = async (req, res) => {
  try {
    const { q, type, city, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    // Build query object
    let query = { isActive: true };

    // Search by name or description
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    // Filter by type (e.g., hospital, pharmacy)
    if (type) {
      query.type = type;
    }

    // Filter by city
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Sorting options
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Fetch facilities with pagination and sorting
    const facilities = await Facility.find(query)
      .populate('admin', 'fullName email')
      .populate('services', 'name description')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortOptions);

    // Get total count for pagination
    const total = await Facility.countDocuments(query);

    res.status(200).json({
      success: true,
      data: facilities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error searching facilities:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getNearbyFacilities = async (req, res) => {
  try {
    const { lat, lng, radius = 10, type, page = 1, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    let query = {
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radius * 1000, 
        },
      },
    };

    if (type) {
      query.type = type;
    }

    const facilities = await Facility.find(query)
      .populate('admin', 'name email')
      .populate('services', 'name description')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Facility.countDocuments(query);

    res.status(200).json({
      success: true,
      data: facilities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error finding nearby facilities:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const getAvailableTimeSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const facilityId = req.params.id;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (format: YYYY-MM-DD)',
      });
    }

    const facility = await Facility.findById(facilityId);

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found',
      });
    }

    const requestedDate = new Date(date);
    const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayHours = facility.hours[dayName];

    if (!dayHours || !dayHours.open || !dayHours.close) {
      return res.status(200).json({
        success: true,
        message: 'Facility is closed on this day',
        data: {
          date,
          availableSlots: [],
        },
      });
    }

    const openTime = parseInt(dayHours.open.replace(':', ''), 10);
    const closeTime = parseInt(dayHours.close.replace(':', ''), 10);

    const timeSlots = [];
    for (let time = openTime; time < closeTime; time += 100) {
      const hour = Math.floor(time / 100);
      const minute = time % 100;
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    res.status(200).json({
      success: true,
      data: {
        date,
        dayName,
        facilityHours: dayHours,
        availableSlots: timeSlots,
      },
    });
  } catch (error) {
    console.error('Error getting available time slots:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFacilityDashboard = async (req, res) => {
  try {
    // Get facilities managed by this admin
    const adminId = req.user.id;
    
    const facilities = await Facility.find({ admin: adminId })
      .populate('services', 'name description');
    
    // Calculate dashboard statistics
    const totalFacilities = facilities.length;
    const activeFacilities = facilities.filter(f => f.isActive).length;
    const averageRating = facilities.reduce((sum, f) => sum + f.rating.average, 0) / totalFacilities || 0;
    const totalReviews = facilities.reduce((sum, f) => sum + f.rating.count, 0);
    
    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalFacilities,
          activeFacilities,
          averageRating: Math.round(averageRating * 100) / 100,
          totalReviews
        },
        facilities
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};



const uploadFacilityPhotos = async (req, res) => {
  try {
    const facilityId = req.params.id;
    const { images } = req.body; 
    
    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        message: 'Images array is required'
      });
    }
    
    const facility = await Facility.findByIdAndUpdate(
      facilityId,
      { $push: { images: { $each: images } } },
      { new: true }
    );
    
    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Facility not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully',
      data: facility
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  addFacility,
  deactivateFacility,
  getAllFacilities,
  updateFacility,
  getFacilityById,
  searchFacilities,
  getNearbyFacilities,
  getAvailableTimeSlots,
  getFacilityDashboard,
  uploadFacilityPhotos
};
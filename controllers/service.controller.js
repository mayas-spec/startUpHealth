const Service = require("../models/services");

const createService = async (req, res) => {
  try {
    // Add the facilityId from the URL to the request body
    const facilityId = req.params.facilityId;
    req.body.facility = facilityId;

    // Create the service
    const newService = await Service.create(req.body);

    // Add the service to the facility's services array
    await Facility.findByIdAndUpdate(facilityId, {
      $push: { services: newService._id }
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: newService,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: error.message });
  }
};


const updateService = async (req, res) => {
  try {
    // Destructure the allowed fields from req.body
    const { name, type, description, category, stock, price, requiresAppointment } = req.body;

    // Construct the updated data object
    const updatedData = {
      ...(name && { name }),
      ...(type && { type }),
      ...(description && { description }),
      ...(category && { category }),
      ...(stock && { stock }),
      ...(price && { price }),
      ...(requiresAppointment !== undefined && { requiresAppointment }),
    };

    // Update the service in the database
    const updatedService = await Service.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });

    if (!updatedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: error.message });
  }
};


const deleteService = async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { stockStatus: req.body.stockStatus },
      { new: true }
    );
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAfacilityServices = async (req, res) => {
  try {
    const { type, inStock } = req.query;
    let query = {
      facility: req.params.facilityId,
      isActive: true
    };
    
    if (type) query.type = type;
    if (inStock === 'true') query['stock.status'] = { $ne: 'out_of_stock' };
    
    const services = await Service.find(query)
      .populate('facility', 'name type')
      .sort({ name: 1 });
    
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLowStock = async (req, res) => {
  try {
    const lowStockServices = await Service.find({
      'stock.status': 'low_stock',
      isActive: true
    })
      .populate('facility', 'name')
      .sort({ 'stock.quantity': 1 });
    
    res.json(lowStockServices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const searchServices = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

  
    const services = await Service.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { type: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    });

    if (services.length === 0) {
      return res.status(404).json({ message: 'No services found matching your query' });
    }

    res.status(200).json({ services });
  } catch (error) {
    console.error('Error searching services:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  createService,
  updateService,
  deleteService,
  updateStock,
  getAfacilityServices,
  getLowStock,
  searchServices
};
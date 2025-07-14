const Service = require("../models/services");

const createService = async (req, res) => {
  try {
    const newService = await Service.create(req.body);
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updatedService);
  } catch (error) {
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
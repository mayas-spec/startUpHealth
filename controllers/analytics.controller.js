const mongoose = require("mongoose");
const Review = require("../models/reviews");
const User = require("../models/User");
const Facility = require("../models/facility");
const Appointment = require("../models/appointment");
const Service = require("../models/services");

// Get platform-wide analytics for system admin
const getPlatformAnalytics = async (req, res) => {
  try {
    const analytics = {
      totalFacilities: await Facility.countDocuments(),
      totalUsers: await User.countDocuments(),
      totalAppointments: await Appointment.countDocuments(),
      facilitiesByType: await Facility.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      appointmentsByStatus: await Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // this brings the month and number of users created in that month
      monthlyRegistrations: await User.aggregate([
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 },
          },
        },
      ]),
    };
    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching platform analytics",
      error: error.message,
    });
  }
};

// Get facility-specific analytics for facility admins
const getFacilityAnalytics = async (req, res) => {
  try {
    const facilityId = req.user.facilityId;

    const analytics = {
      totalAppointments: await Appointment.countDocuments({ facilityId }),
      totalServices: await Service.countDocuments({ facilityId }),
      averageRating: await Review.aggregate([
        { $match: { facilityId } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]),
      appointmentsByMonth: await Appointment.aggregate([
        { $match: { facilityId } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 },
          },
        },
      ]),
      servicesByCategory: await Service.aggregate([
        { $match: { facilityId } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching facility analytics",
      error: error.message,
    });
  }
};

//  This is system monitoring data showing my application and database health.
const getSystemAnalytics = async (req, res) => {
  try {
    const analytics = {
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      databaseStats: {
        totalCollections: await mongoose.connection.db.stats(),
        connectionCount: mongoose.connection.readyState,
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching system analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getFacilityAnalytics,
  getPlatformAnalytics,
  getSystemAnalytics,
};

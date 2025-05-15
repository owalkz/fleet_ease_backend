const Trip = require("../models/tripModel");
const Driver = require("../models/driverModel");
const Vehicle = require("../models/vehicleModel");
const { isManager } = require("../utils/functions/authFunctions");

// 1. Overview Report
const getManagerOverviewReport = async (req, res) => {
  try {
    const manager = await isManager(req.user);
    if (!manager) return res.status(403).json({ message: "Unauthorized" });

    const managerId = req.user._id;

    const [drivers, vehicles, trips] = await Promise.all([
      Driver.find({ managerId, accountStatus: "active" }),
      Vehicle.find({ managerId }),
      Trip.find({ managerId }),
    ]);

    const totalDrivers = drivers.length;
    const activeVehicles = vehicles.filter((v) => v.status === "In Use").length;
    const availableVehicles = vehicles.filter(
      (v) => v.status === "Available"
    ).length;

    const totalTrips = trips.length;
    const completedTrips = trips.filter((t) => t.status === "completed").length;
    const pendingTrips = trips.filter((t) => t.status === "pending").length;
    const activeTrips = trips.filter((t) => t.status === "active").length;

    const totalDistance = trips.reduce(
      (sum, t) => sum + (t.distanceTraveled || 0),
      0
    );

    const harshEventCount = trips.reduce((sum, trip) => {
      const harshEvents =
        trip.speedLogs?.filter((log) => log.eventType).length || 0;
      return sum + harshEvents;
    }, 0);

    res.status(200).json({
      totalDrivers,
      activeVehicles,
      availableVehicles,
      totalTrips,
      completedTrips,
      pendingTrips,
      activeTrips,
      totalDistance: +totalDistance.toFixed(2),
      harshEventCount,
      recentTrips: trips.slice(-5).map((t) => ({
        tripId: t._id,
        startTime: t.startTime,
        endTime: t.endTime,
        status: t.status,
        distanceTraveled: t.distanceTraveled,
      })),
    });
  } catch (error) {
    console.error("Overview Report Error:", error);
    res.status(500).json({ message: "Error generating report", error });
  }
};

// 2. Monthly Trip Stats
const getMonthlyTripStats = async (req, res) => {
  try {
    const managerId = req.user._id;

    const stats = await Trip.aggregate([
      {
        $match: {
          managerId,
          status: { $in: ["completed", "active", "pending"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$startTime" } },
          tripCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error generating trip stats:", error);
    res
      .status(500)
      .json({ message: "Failed to generate trip statistics", error });
  }
};

// 3. Vehicle Usage Report
const getVehicleUsageReport = async (req, res) => {
  try {
    const managerId = req.user._id;

    const vehicles = await Vehicle.find({ managerId });
    const trips = await Trip.find({ managerId, status: "completed" }).populate(
      "vehicleId"
    );

    const report = vehicles.map((vehicle) => {
      const vehicleTrips = trips.filter(
        (trip) => trip.vehicleId?._id.toString() === vehicle._id.toString()
      );

      const totalDistance = vehicleTrips.reduce(
        (sum, trip) => sum + (trip.distanceTraveled || 0),
        0
      );
      const totalSpeedLogs = vehicleTrips.flatMap(
        (trip) => trip.speedLogs || []
      );
      const averageSpeed =
        totalSpeedLogs.length > 0
          ? totalSpeedLogs.reduce((sum, log) => sum + log.speed, 0) /
            totalSpeedLogs.length
          : 0;

      return {
        vehicleId: vehicle._id,
        make: vehicle.make,
        model: vehicle.model,
        licensePlateNumber: vehicle.licensePlateNumber,
        tripCount: vehicleTrips.length,
        totalDistance: +totalDistance.toFixed(2),
        averageSpeed: +averageSpeed.toFixed(2),
        createdAt: vehicle.createdAt,
      };
    });

    res.status(200).json(report);
  } catch (error) {
    console.error("Vehicle Usage Report Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch vehicle usage report", error });
  }
};

// 4. Driver Summary Report
const getDriverSummaryReport = async (req, res) => {
  try {
    const managerId = req.user._id;

    const trips = await Trip.find({ managerId }).populate("driverId");

    const drivers = {};

    trips.forEach((trip) => {
      const driverId = trip.driverId?._id?.toString();
      if (!driverId) return;

      if (!drivers[driverId]) {
        drivers[driverId] = {
          name: trip.driverId.name,
          tripCount: 0,
          totalDistance: 0,
          harshEvents: 0,
        };
      }

      drivers[driverId].tripCount += 1;
      drivers[driverId].totalDistance += trip.distanceTraveled || 0;
      drivers[driverId].harshEvents +=
        trip.speedLogs?.filter((log) => log.eventType)?.length || 0;
    });

    const result = Object.entries(drivers).map(([id, data]) => ({
      driverId: id,
      ...data,
      avgDistance: +(data.totalDistance / data.tripCount).toFixed(2),
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Driver Summary Error:", error);
    res.status(500).json({ message: "Failed to fetch driver summary", error });
  }
};

// 5. Drivers With Expiring Licenses
const getDriversWithExpiringLicenses = async (req, res) => {
  try {
    const managerId = req.user._id;
    const days = parseInt(req.query.days) || 30;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const drivers = await Driver.find({
      managerId,
      licenseExpiryDate: { $lte: futureDate },
    }).select("name emailAddress licenseExpiryDate profilePhoto");

    res.status(200).json(drivers);
  } catch (error) {
    console.error("License Expiry Report Error:", error);
    res.status(500).json({ message: "Failed to fetch license report", error });
  }
};

// 6. Driver Performance
const getDriverPerformanceReport = async (req, res) => {
  try {
    const driverId = req.user._id;

    const trips = await Trip.find({ driverId, status: "completed" });

    const tripCount = trips.length;
    const totalDistance = trips.reduce(
      (sum, trip) => sum + (trip.distanceTraveled || 0),
      0
    );

    const speedLogs = trips.flatMap((trip) => trip.speedLogs || []);
    const averageSpeed =
      speedLogs.length > 0
        ? speedLogs.reduce((sum, log) => sum + log.speed, 0) / speedLogs.length
        : 0;

    const harshEvents = speedLogs.filter((log) => log.eventType).length;

    res.status(200).json({
      tripCount,
      totalDistance: +totalDistance.toFixed(2),
      averageSpeed: +averageSpeed.toFixed(2),
      harshEvents,
      recentTrips: trips.slice(-5).map((t) => ({
        tripId: t._id,
        startTime: t.startTime,
        endTime: t.endTime,
        distanceTraveled: t.distanceTraveled,
      })),
    });
  } catch (error) {
    console.error("Driver Performance Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch driver performance", error });
  }
};

// 7. Service Overdue Vehicles
const getServiceOverdueVehicles = async (req, res) => {
  try {
    const managerId = req.user._id;

    const vehicles = await Vehicle.find({
      managerId,
      nextServiceMileage: { $ne: null },
    });

    const overdueVehicles = vehicles.filter(
      (v) => v.nextServiceMileage && v.mileage > v.nextServiceMileage
    );

    res.status(200).json(
      overdueVehicles.map((v) => ({
        ...v.toObject(),
        createdAt: v.createdAt,
      }))
    );
  } catch (error) {
    console.error("Service Overdue Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch overdue vehicles", error });
  }
};

// 8. Vehicle Usage Breakdown
const getVehicleUsageBreakdown = async (req, res) => {
  try {
    const managerId = req.user._id;

    const trips = await Trip.find({ managerId, status: "completed" }).populate(
      "vehicleId"
    );

    const usage = {};

    trips.forEach((trip) => {
      const vehicleId = trip.vehicleId?._id?.toString();
      if (!vehicleId) return;

      if (!usage[vehicleId]) {
        usage[vehicleId] = {
          vehicle: trip.vehicleId,
          tripCount: 0,
          totalDistance: 0,
          speedSum: 0,
          speedCount: 0,
        };
      }

      usage[vehicleId].tripCount += 1;
      usage[vehicleId].totalDistance += trip.distanceTraveled || 0;

      (trip.speedLogs || []).forEach((log) => {
        usage[vehicleId].speedSum += log.speed;
        usage[vehicleId].speedCount += 1;
      });
    });

    const breakdown = Object.values(usage).map((data) => ({
      vehicleId: data.vehicle._id,
      make: data.vehicle.make,
      model: data.vehicle.model,
      licensePlateNumber: data.vehicle.licensePlateNumber,
      tripCount: data.tripCount,
      totalDistance: +data.totalDistance.toFixed(2),
      averageSpeed:
        data.speedCount > 0 ? +(data.speedSum / data.speedCount).toFixed(2) : 0,
      createdAt: data.vehicle.createdAt,
    }));

    res.status(200).json(breakdown);
  } catch (error) {
    console.error("Usage Breakdown Error:", error);
    res.status(500).json({ message: "Failed to fetch vehicle usage", error });
  }
};

// 9. Vehicles With Expiring Insurance
const getVehiclesWithExpiringInsurance = async (req, res) => {
  try {
    const managerId = req.user._id;
    const days = parseInt(req.query.days) || 30;

    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + days);

    const vehicles = await Vehicle.find({
      managerId,
      insuranceExpiryDate: {
        $lte: expiryDate,
        $gte: now,
      },
    });

    res.status(200).json(
      vehicles.map((v) => ({
        ...v.toObject(),
        createdAt: v.createdAt,
      }))
    );
  } catch (error) {
    console.error("Insurance Expiry Error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch expiring insurance", error });
  }
};

// 10. Trip Summary Report
const getTripSummaryReport = async (req, res) => {
  try {
    const managerId = req.user._id;

    const trips = await Trip.find({ managerId });

    const summary = {
      pending: 0,
      active: 0,
      completed: 0,
      totalDistance: 0,
      averageDuration: 0,
    };

    let totalDuration = 0;
    let completedCount = 0;

    for (const trip of trips) {
      summary[trip.status] += 1;
      summary.totalDistance += trip.distanceTraveled || 0;

      if (trip.status === "completed" && trip.startTime && trip.endTime) {
        const duration =
          (new Date(trip.endTime) - new Date(trip.startTime)) / (1000 * 60); // in minutes
        totalDuration += duration;
        completedCount += 1;
      }
    }

    summary.totalDistance = +summary.totalDistance.toFixed(2);
    summary.averageDuration =
      completedCount > 0 ? +(totalDuration / completedCount).toFixed(2) : 0;

    res.status(200).json(summary);
  } catch (error) {
    console.error("Trip Summary Report Error:", error);
    res.status(500).json({ message: "Failed to fetch trip summary", error });
  }
};

// 11. Harsh Events Report
const getHarshEventsReport = async (req, res) => {
  try {
    const managerId = req.user._id;

    const trips = await Trip.find({ managerId, status: "completed" })
      .select("startLocation endLocation speedLogs startTime endTime")
      .populate("vehicleId", "licensePlateNumber make model");

    const report = trips.map((trip) => {
      const harshCount =
        trip.speedLogs?.filter((log) => log.eventType && log.eventType !== "")
          .length || 0;

      return {
        tripId: trip._id,
        vehicle: trip.vehicleId,
        harshEventCount: harshCount,
        startLocation: trip.startLocation,
        endLocation: trip.endLocation,
        startTime: trip.startTime,
        endTime: trip.endTime,
      };
    });

    res.status(200).json(report);
  } catch (error) {
    console.error("Harsh Events Report Error:", error);
    res.status(500).json({ message: "Failed to fetch harsh events", error });
  }
};

// 12. Trip Volume Comparison
const getTripVolumeComparison = async (req, res) => {
  try {
    const managerId = req.user._id;

    const stats = await Trip.aggregate([
      { $match: { managerId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$startTime" } },
          tripCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Trip Volume Comparison Error:", error);
    res.status(500).json({ message: "Failed to compare trip volumes", error });
  }
};

module.exports = {
  getManagerOverviewReport,
  getMonthlyTripStats,
  getVehicleUsageReport,
  getDriverSummaryReport,
  getDriversWithExpiringLicenses,
  getDriverPerformanceReport,
  getServiceOverdueVehicles,
  getVehicleUsageBreakdown,
  getVehiclesWithExpiringInsurance,
  getTripSummaryReport,
  getHarshEventsReport,
  getTripVolumeComparison,
};

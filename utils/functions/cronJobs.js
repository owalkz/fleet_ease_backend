const Driver = require("../../models/driverModel");
const Vehicle = require("../../models/vehicleModel");
const sendNotification = require("./sendNotification");

const notifyLicenseExpiry = async () => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const drivers = await Driver.find({
    licenseExpiryDate: { $lte: in7Days, $gte: now },
  });

  for (const driver of drivers) {
    await sendNotification({
      recipientId: driver._id,
      recipientType: "driver",
      message: "Your license is about to expire. Please renew it soon.",
    });
  }
};

const notifyInsuranceExpiry = async () => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const vehicles = await Vehicle.find({
    insuranceExpiryDate: { $lte: in7Days, $gte: now },
  });

  for (const vehicle of vehicles) {
    await sendNotification({
      recipientId: vehicle.managerId,
      recipientType: "manager",
      message: `Insurance for vehicle ${vehicle.licensePlateNumber} is expiring soon.`,
    });
  }
};

const notifyServiceDue = async () => {
  const vehicles = await Vehicle.find({
    nextServiceMileage: { $exists: true },
  });

  for (const vehicle of vehicles) {
    const diff = vehicle.nextServiceMileage - vehicle.mileage;
    if (diff <= 500) {
      // Notify manager
      await sendNotification({
        recipientId: vehicle.managerId,
        recipientType: "manager",
        message: `Vehicle ${vehicle.licensePlateNumber} is nearing service mileage.`,
      });

      if (vehicle.assignedDriverId) {
        await sendNotification({
          recipientId: vehicle.assignedDriverId,
          recipientType: "driver",
          message: `Your vehicle ${vehicle.licensePlateNumber} is due for service soon.`,
        });
      }
    }
  }
};

module.exports = {
  notifyLicenseExpiry,
  notifyInsuranceExpiry,
  notifyServiceDue,
};

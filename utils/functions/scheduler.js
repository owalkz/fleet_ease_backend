const cron = require("node-cron");
const {
  notifyLicenseExpiry,
  notifyInsuranceExpiry,
  notifyServiceDue,
} = require("./cronJobs");

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily cron jobs...");

  try {
    await notifyLicenseExpiry();
    await notifyInsuranceExpiry();
    await notifyServiceDue();
    console.log("All cron jobs completed.");
  } catch (error) {
    console.error("Error running cron jobs:", error);
  }
});

// utils/sendNotification.js
const Notification = require("../../models/notificationModel");

const sendNotification = async ({ recipientId, recipientType, message }) => {
  try {
    const notification = new Notification({
      recipientId,
      recipientType,
      message,
    });
    await notification.save();
  } catch (error) {
    console.error("Notification Error:", error.message);
  }
};

module.exports = sendNotification;

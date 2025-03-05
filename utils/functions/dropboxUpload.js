const Dropbox = require("dropbox").Dropbox;
require("dotenv").config();
const fetch = require("node-fetch");

const REFRESH_TOKEN = process.env.DROPBOX_REFRESH_TOKEN;
const CLIENT_ID = process.env.DROPBOX_CLIENT_KEY;
const CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET;

// Function to get a new access token
const getNewAccessToken = async () => {
  while (true) {
    try {
      const response = await fetch("https://api.dropbox.com/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: REFRESH_TOKEN,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      });

      if (!response.ok) throw new Error("Failed to refresh access token");
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("Error refreshing access token, retrying:", error.message);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after 5s
    }
  }
};

// Initialize Dropbox SDK
const initializeDropbox = async () => {
  const accessToken = await getNewAccessToken();
  return new Dropbox({ accessToken, fetch });
};

// Determine file type (for organization)
const getFileType = (mimetype) => {
  if (mimetype.startsWith("image/") || mimetype === "image/png")
    return "images";
  if (mimetype === "application/pdf") return "pdfs";
  if (mimetype.startsWith("video/")) return "videos";
  return "others";
};

// **1️⃣ Upload File to Dropbox**
const uploadFileToDropbox = async (
  baseDirectory,
  fileBuffer,
  fileName,
  mimetype
) => {
  try {
    const dbx = await initializeDropbox();
    const fileType = getFileType(mimetype);
    const dropboxPath = baseDirectory.includes("CourseFiles")
      ? `/${baseDirectory}/${fileType}/${fileName}`
      : `/${baseDirectory}/${fileName}`;

    // Upload file
    const response = await dbx.filesUpload({
      path: dropboxPath,
      contents: fileBuffer,
      mode: "add",
      autorename: true,
    });

    // Check for existing shared link
    const existingLinks = await dbx.sharingListSharedLinks({
      path: response.result.path_lower,
    });
    if (existingLinks.result.links.length > 0) {
      return {
        name: fileName,
        url: existingLinks.result.links[0].url.replace("?dl=0", "?raw=1"),
      };
    }

    // Create new shared link
    const linkResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: response.result.path_lower,
    });
    return {
      name: fileName,
      type: fileType.slice(0, -1),
      url: linkResponse.result.url.replace("?dl=0", "?raw=1"),
    };
  } catch (error) {
    console.error("Dropbox Upload Error:", error);
    throw new Error("Failed to upload file to Dropbox");
  }
};

// **2️⃣ Delete File from Dropbox**
const deleteFileFromDropbox = async (filePath) => {
  try {
    const dbx = await initializeDropbox();
    await dbx.filesDeleteV2({ path: filePath });
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error("Dropbox Delete Error:", error);
    throw new Error("Failed to delete file from Dropbox");
  }
};

// **3️⃣ Replace File in Dropbox**
const replaceFileInDropbox = async (
  baseDirectory,
  oldFileName,
  newFileBuffer,
  newFileName,
  mimetype
) => {
  try {
    const oldFilePath = `/${baseDirectory}/${getFileType(
      mimetype
    )}/${oldFileName}`;

    // Delete the old file
    await deleteFileFromDropbox(oldFilePath);

    // Upload the new file
    return await uploadFileToDropbox(
      baseDirectory,
      newFileBuffer,
      newFileName,
      mimetype
    );
  } catch (error) {
    console.error("Dropbox Replace Error:", error);
    throw new Error("Failed to replace file in Dropbox");
  }
};

module.exports = {
  uploadFileToDropbox,
  deleteFileFromDropbox,
  replaceFileInDropbox,
};
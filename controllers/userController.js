const {
  uploadFileToDropbox,
  replaceFileInDropbox,
} = require("../utils/functions/dropboxUpload");

const getUserProfile = (req, res, next) => {
  const user = req.user;
  const { password, ...userWithoutPassword } = user.toObject();
  return res.status(200).json({ user: userWithoutPassword });
};

// const editUserProfile = async (req, res, next) => {
//   const { name } = req.body;
//   const user = req.user;
//   if (!name) res.status(422).json({ message: "Name not Provided!" });
//   user.name = name;
//   try {
//     const updatedUser = await user.save();
//     const { password, ...userWithoutPassword } = updatedUser.toObject();
//     res.status(200).json({ message: "Username updated successfully!" });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Error updating user profile", error: err });
//   }
// };

const editUserProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name } = req.body;
    if (!req.file && !name)
      return res
        .status(400)
        .json({ error: "No file uploaded or no details modified." });
    const file = req.file;

    if (file && name) {
      if (!user.profilePhoto || user.profilePhoto.url === "") {
        // Upload the file to Dropbox
        const fileUrl = await uploadFileToDropbox(
          `ProfilePictures/${user.id}`,
          file.buffer,
          file.originalname,
          file.mimetype
        );

        user.profilePhoto.url = fileUrl.url || user.profilePhoto.url;
        user.profilePhoto.fileName =
          fileUrl.fileName || user.profilePhoto.fileName;
        user.name = name || user.name;
      } else {
        const fileUrl = await replaceFileInDropbox(
          `ProfilePictures/${user.id}`,
          user.profilePhoto.fileName,
          file.buffer,
          file.originalname
        );
        user.profilePhoto.url = fileUrl.url || user.profilePhoto.url;
        user.profilePhoto.fileName =
          fileUrl.fileName || user.profilePhoto.fileName;
        user.name = name || user.name;
      }

      await user.save();
      const newUrl = user.profilePhoto.url;
      res.status(201).json({
        message: "Files uploaded successfully",
        newUrl,
      });
    } else if (name && !file) {
      user.name = name || user.name;
      await user.save();
      return res.status(201).json({ message: "Name updated successfully!" });
    }
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUserProfile,
  editUserProfile,
};

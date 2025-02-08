const getUserProfile = (req, res, next) => {
  const user = req.user;
  const { password, ...userWithoutPassword } = user.toObject();
  return res.status(200).json({ user: userWithoutPassword });
};

const editUserProfile = async (req, res, next) => {
  const { name } = req.body;
  const user = req.user;
  if (!name) res.status(422).json({ message: "Name not Provided!" });
  user.name = name;
  try {
    const updatedUser = await user.save();
    const { password, ...userWithoutPassword } = updatedUser.toObject();
    res.status(200).json({ message: "Username updated successfully!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating user profile", error: err });
  }
};

module.exports = {
  getUserProfile,
  editUserProfile,
};

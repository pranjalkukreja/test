const User = require("../models/user");

exports.createOrUpdateUser = async (req, res) => {
  const { picture, email, phone_number } = req.user;
  const { name } = req.body;

  const user = await User.findOneAndUpdate(
    { email },
    // { name: email.split("@")[0], picture },
    { new: true }
  );
  if (user) {
    console.log("USER UPDATED", user);
    res.json(user);
  } else {
    const newUser = await new User({
      email,
      name: name,
      picture,
    }).save();
    console.log("USER CREATED", newUser);
    res.json(newUser);
  }
};


exports.createOrUpdateUserNumber = async (req, res) => {
  const {phone_number} = req.user

  const email = `${phone_number}@example.com`

  console.log(email);
  

  const user = await User.findOneAndUpdate(
    { email },
    // { name: email.split("@")[0], picture },
    { new: true }
  );
  if (user) {
    console.log("USER UPDATED", user);
    res.json(user);
  } else {
    const newUser = await new User({
      PhoneNumber: phone_number,
      email: email,
      name: phone_number,
    }).save();
    console.log("USER CREATED", newUser);
    res.json(newUser);
  }
}

exports.currentUser = async (req, res) => {
  User.findOne({ email: req.user.email })
  .populate({ path: 'employee', populate: { path: 'store', select: 'address _id city createdAt flyer name slug storeNumber longitude latitude company' } })
  .exec((err, user) => {
    if (err) throw new Error(err);
    res.json(user);
  });
};


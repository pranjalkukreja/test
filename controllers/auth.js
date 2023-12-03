const User = require("../models/user");
const Article = require('../models/article');

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

exports.getFavorites = async (req, res) => {
    try {
        const { userId } = req.query;

        // Find the user and populate the 'likes' field with article data
        const userWithLikes = await User.findById(userId)
            .populate('likes')
            .exec();

        if (!userWithLikes) {
            return res.status(404).json({ message: 'User not found' });
        }

        const likedArticles = userWithLikes.likes; // Array of Article documents

        // Transform the data as needed for the frontend
        const articlesToSend = likedArticles.map(article => ({
            // Extract relevant article fields
            _id: article._id,
            title: article.title,
            description: article.description,
            url: article.url,
            urlToImage: article.urlToImage,
            // ... other fields you might need
        }));

        res.json({ favorites: articlesToSend });

    } catch (err) {
        console.log(err);
        res.status(400).json({ err: err.message });
    }
};

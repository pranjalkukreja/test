const User = require("../models/user");
const Article = require('../models/article');
const mongoose = require("mongoose");

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
  const { phone_number } = req.user

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

    const likedArticles = userWithLikes.likes.reverse(); // Reverse the array of Article documents

    const articlesToSend = likedArticles.map(article => ({
      _id: article._id,
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
    }));

    res.json({ favorites: articlesToSend });

  } catch (err) {
    console.error(err);
    res.status(400).json({ err: err.message });
  }
};




exports.recordActivity = async (req, res) => {
  const { articleTitle, timeSpent } = req.body.record;

  try {
    // Find the user by their email address
    const user = await User.findOne({ email: req.user.email }).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find if the article already exists in the activity log
    const existingActivityIndex = user.activityLog.findIndex(activity => activity.article === articleTitle);

    // Cap the time spent at 10 seconds
    const recordedTime = Math.min(timeSpent, 10000);

    if (existingActivityIndex > -1) {
      // Update the time spent on the existing article
      user.activityLog[existingActivityIndex].timeSpent += recordedTime;
    } else {
      // Add a new activity for the article
      const activity = {
        article: articleTitle,
        date: new Date(),
        timeSpent: recordedTime
      };
      user.activityLog.push(activity);
    }

    await user.save();

    res.json({ message: 'Activity recorded successfully', activityLog: user.activityLog });
  } catch (err) {
    console.error(err);
    res.status(400).json({ err: err.message });
  }
};

exports.readUserDetails = async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await User.findOne({ _id: userId }).exec();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get today's date at start (00:00:00)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Count the number of articles read today
    const todaysRead = user.activityLog.filter(activity => 
      new Date(activity.date).getTime() >= startOfToday.getTime()
    ).length;

    // Count the total number of articles read
    const totalRead = user.activityLog.length;

    res.json({ todaysRead: todaysRead, totalRead: totalRead });
  } catch (err) {
    console.error(err);
    res.status(400).json({ err: err.message });
  }
};


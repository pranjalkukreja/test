const User = require("../models/user");
const Article = require('../models/article');
const Guest = require('../models/guest');
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

exports.createGuest = async (req, res) => {
  // Check if the uniqueId already exists in the database

  // Create a new guest document with the uniqueId
  try {
    // Save the new guest document to the database
    const newGuest = await new Guest().save();
    console.log(newGuest);
    return res.status(201).json({ success: true, message: 'Guest created successfully', id: newGuest._id });
  } catch (error) {
    console.error('Error saving guest to database:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

exports.updateGuestLocation = async (req, res) => {
  const { uniqueId, city, country, countryCode } = req.body;
  console.log('yeet', req.body);
  try {
    // Find the guest profile by uniqueId
    const guest = await Guest.findOne({ _id: uniqueId });

    // If guest profile doesn't exist, return error
    if (!guest) {
      return res.status(404).json({ error: 'Guest profile not found' });
    }

    // Update the city and country fields in the guest profile
    guest.city = city;
    guest.country = country;
    guest.countryCode = countryCode;
    // Save the updated guest profile
    await guest.save();

    return res.status(200).json({ message: 'Location data saved successfully' });
  } catch (error) {
    console.error('Error saving location data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

exports.updateGuestNotifications = async (req, res) => {
  const { Id, code } = req.body;
  console.log('yeet', req.body);
  try {
    // Find the guest profile by uniqueId
    const guest = await Guest.findOne({ _id: Id });

    // If guest profile doesn't exist, return error
    if (!guest) {
      return res.status(404).json({ error: 'Guest profile not found' });
    }

    // Update the city and country fields in the guest profile
    guest.expoKey = code;

    // Save the updated guest profile
    await guest.save();

    return res.status(200).json({ success: true, message: 'Expo Key Saved successfully' });
  } catch (error) {
    console.error('Error saving key data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


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


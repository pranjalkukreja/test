const User = require("../models/user");
const Article = require('../models/article');
const Guest = require('../models/guest');
const mongoose = require("mongoose");
const { Expo } = require('expo-server-sdk');
const axios = require('axios');
const cron = require('node-cron');

let expo = new Expo();

exports.createOrUpdateUser = async (req, res) => {
  const { picture, email, phone_number } = req.user;
  const { name, uniqueId } = req.body;

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
      guestId: uniqueId
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
    .exec((err, user) => {
      if (err) throw new Error(err);
      res.json(user);
    });
};

exports.updateUserInfo = async (req, res) => {
  const { values } = req.body;

  try {
    // Destructure the fields from values object and ensure they match your schema
    const { name, PhoneNumber } = values;

    // Update the user document using the field names from your schema
    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email }, // Verify req.user.email is correctly provided
      {
        name: name, // Assuming you want to update the name field
        PhoneNumber: PhoneNumber // This now matches the case in your schema
      },
      { new: true }
    ).exec();

    res.json({ ok: true }); // Optionally send back updated user info
  } catch (err) {
    console.error(err);
    res.status(400).json({ err: err.message });
  }
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

exports.getUniqueCountries = async (req, res) => {
  try {
    const countries = await Guest.aggregate([
      {
        $group: {
          _id: "$country", // Group by the country field
        }
      },
      {
        $sort: { _id: 1 } // Optionally sort the countries alphabetically
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the results
          country: "$_id" // Include the country field with the name 'country'
        }
      }
    ]);

    res.json(countries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listAllUsers = async (req, res) => {
  let alltransaction = await User.find({})
    .sort("-createdAt")
    .exec();

  res.json(alltransaction);
};

exports.listAllGuests = async (req, res) => {
  let alltransaction = await Guest.find({})
    .sort("-createdAt")
    .exec();

  res.json(alltransaction);
};

exports.sendExpoNotifications = async (req, res) => {

  const { country, tags, title, description } = req.body.value;
  let query = {};
  if (country) query['country'] = country;
  if (tags && tags.length) query['interestScore.tag'] = { $in: tags };

  try {
    const guests = await Guest.find(query).exec();

    // Create the messages that you want to send to clients
    let messages = [];
    for (let guest of guests) {
      if (!Expo.isExpoPushToken(guest.expoKey)) {
        console.error(`Push token ${guest.expoKey} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: guest.expoKey,
        sound: 'default',
        title: title,
        body: description,
        data: { screen: 'NewsPage', params: { newsId: '123' } },
      });
    }

    // The Expo push notification service accepts batches of notifications so
    // we'll split our array into chunks of PUSH_CHUNK_SIZE messages.
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(error);
      }
    }

    res.status(200).json({ message: 'Notifications sent successfully', tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

}

exports.fetchNewsAndPrepareNotifications = async (req, res) => {
  try {
    const uniqueCountryCodes = await Guest.distinct("countryCode");
    const apiKey = 'e1c3df52a3d9439fa286ef24c11de7b6';
    const newsByCountry = {};
    const notificationCounts = {}; // To keep track of notifications sent per country

    for (let countryCode of uniqueCountryCodes) {
      if (!countryCode) continue;

      const params = {
        country: countryCode,
        pageSize: 1,
        apiKey: apiKey,
      };

      let response = await axios.get('https://newsapi.org/v2/top-headlines', { params });
      let articles = response.data.articles;
      const countryName = countryCodeToName(countryCode);

      newsByCountry[countryCode] = {
        articles: articles.slice(0, 3),
        countryName: countryName,
      };

      // Initialize notification count for each country
      notificationCounts[countryCode] = 0;
    }

    let messages = [];
    const guests = await Guest.find({}).exec();

    for (let guest of guests) {
      if (!guest.countryCode || !guest.expoKey || !newsByCountry[guest.countryCode]) continue;

      const { articles, countryName } = newsByCountry[guest.countryCode];

      // Prepare the notification payload
      if (!Expo.isExpoPushToken(guest.expoKey)) {
        console.error(`Push token ${guest.expoKey} is not a valid Expo push token`);
        continue;
      }

      // Inside your notification sending loop or function
      messages.push({
        to: guest.expoKey,
        sound: 'default',
        title: `Top News in ${countryName}`,
        body: articles.length > 0 ? `${articles[0].title}` : "No news is good news!",
        data: {
          screen: 'NewsPage',
          customMessage: articles.length > 0 ? articles[0] : null,
          country: guest.country,
          countryCode: guest.countryCode,
        },
      });

      // Increment the notification count for this country
      notificationCounts[guest.countryCode]++;
    }

    // Send the notifications in batches
    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    }

    // Prepare the summary of notifications sent
    let summary = {};
    for (let countryCode in notificationCounts) {
      const countryName = countryCodeToName(countryCode);
      summary[countryName] = notificationCounts[countryCode];
    }

    res.json({ ok: true, notificationsSentSummary: summary });

  } catch (error) {
    console.error("Error fetching news or preparing notifications:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

function countryCodeToName(code) {
  const countryCodeMap = {
    US: 'United States',
    GB: 'Great Britain',
    // Add more mappings as needed
  };
  return countryCodeMap[code] || code;
}

function generateRandomTimes(numberOfTimes) {
  const times = [];
  for (let i = 0; i < numberOfTimes; i++) {
      // Generate a random hour between 9 AM (9) and 9 PM (21)
      const hour = Math.floor(Math.random() * (21 - 9 + 1)) + 9;
      // Generate a random minute
      const minute = Math.floor(Math.random() * 60);
      times.push(`${minute} ${hour} * * *`);
  }
  return times;
}


let scheduledTasks = [];

function scheduleRandomDailyTasks() {
    // Clear existing schedules
    scheduledTasks.forEach(task => task.stop());
    scheduledTasks = [];

    // Generate and schedule new tasks
    const randomTimes = generateRandomTimes(9); // You can adjust the number of times as needed
    randomTimes.forEach(time => {
        const task = cron.schedule(time, async () => {
            try {
                console.log(`Running fetchNewsAndPrepareNotifications at ${time}.`);
                await exports.fetchNewsAndPrepareNotifications(); // Make sure this is adapted to your function
            } catch (error) {
                console.error("Scheduled task failed:", error);
            }
        }, {
            scheduled: true
        });
        scheduledTasks.push(task);
    });
}

// Schedule the reset function to run at midnight
cron.schedule('0 0 * * *', scheduleRandomDailyTasks);

// Initialize the random daily tasks on startup
scheduleRandomDailyTasks();

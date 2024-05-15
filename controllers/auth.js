const User = require("../models/user");
const Article = require('../models/article');
const Guest = require('../models/guest');
const mongoose = require("mongoose");
const { Expo } = require('expo-server-sdk');
const axios = require('axios');
const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
let expo = new Expo();
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

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
    const apiKey = '307e1bb50d9a470f890df5280aab94b7';
    const newsByCountry = {};
    const notificationCounts = {};

    for (let countryCode of uniqueCountryCodes) {
      if (!countryCode) continue;

      let page = 1; // Start from the first page
      let articles;
      let countryName = countryCodeToName(countryCode);

      do {
        const params = {
          country: countryCode,
          pageSize: 1,
          page: page++,
          apiKey: apiKey,
        };

        let response = await axios.get('https://newsapi.org/v2/top-headlines', { params });
        articles = response.data.articles;

        // Check if articles have already been sent
        const articleTitles = articles.map(article => article.title);
        const sentArticles = await Article.find({ 'title': { $in: articleTitles }, 'url': { $in: articles.map(article => article.url) } });

        if (sentArticles.length === 0) break; // If no sent articles match, proceed with these articles
      } while (articles.length > 0);

      if (articles.length === 0) continue; // Skip if no new articles are found

      // Save articles to DB (if not already saved)
      await Promise.all(articles.map(article => {
        const articleToSave = {
          source: {
            id: article.source.id,
            name: article.source.name
          },
          author: article.author,
          title: article.title,
          description: article.description,
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          content: article.content
        };
        return Article.findOneAndUpdate({ url: article.url }, articleToSave, { upsert: true, new: true });
      }));
      

      newsByCountry[countryCode] = {
        articles: articles,
        countryName: countryName,
      };

      notificationCounts[countryCode] = 0;

      if (countryCode.toUpperCase() === 'US' && articles.length > 0) {
         exports.createRandomNewsImage(articles[0]);  // Assuming createRandomNewsImage is modified to accept an article object
      }
    }

    let messages = [];
    const guests = await Guest.find({}).exec();

    for (let guest of guests) {
      if (!guest.countryCode || !guest.expoKey || !newsByCountry[guest.countryCode]) continue;

      const { articles, countryName } = newsByCountry[guest.countryCode];

      if (!Expo.isExpoPushToken(guest.expoKey)) {
        console.error(`Push token ${guest.expoKey} is not a valid Expo push token`);
        continue;
      }

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

      notificationCounts[guest.countryCode]++;
    }

    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    }

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

cron.schedule('0 * * * *', async () => {
  console.log('Running fetchNewsAndPrepareNotifications every 2 hours');
  try {
      // Assuming fetchNewsAndPrepareNotifications is an async function and doesn't need req, res
      await exports.fetchNewsAndPrepareNotifications(); // Adjust as needed for your actual function call
  } catch (error) {
      console.error("Error during scheduled task:", error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Kolkata" 
});


exports.createRandomNewsImage = async (article) => {
  try {

    const titleResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Create a concise title from this text: "${article.title}. ${article.description}. ${article.content}". Make sure that it is in 11-13 words as it will come on the pics that goes to instagram  Just give me the caption and nothing else. dnt mention here is the caption or anything else  just the content i want as it will directly go to customer. Also dont put the output in quotations and also make the title which is easy to understand` },
      ],
    });

    const conciseTitle = titleResponse.data.choices[0].message.content.trim();
    console.log(conciseTitle);
    // Now use axios to post data to your own API to create an image
    const imageResponse = await axios.post('https://optimamart.com/api/create-image-loop', {
      title: conciseTitle,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt
    });

    // Assuming the image creation endpoint returns the URL of the created image
    const imageUrl = imageResponse.data.imageUrl;
    const captionResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Create a detailed 80-90 words caption and 25-30 relevant hashtags from this text: "${article.title}. ${article.description}. ${article.content}". Just give me the best summarization with details of it and give me the content straight, dont give me anything else such as this is the information or anything. Also dont mention caption or hashtags in the post  this will directly go to insta so dont make it feel like AI generated. Also dont put the caption in commas` },
      ],
    });

    const captionDetails = captionResponse.data.choices[0].message.content.trim();
    console.log(captionDetails);

    const instagramParams = {
      image_url: imageUrl,
      caption: captionDetails,
      access_token: 'EAADLqeAjhXEBOZCgFiysRVtZBxY505GYrIBkCdEiOWZB5ZAU13YlmgvAf7Emb2LB3aWdCqmwPKCOzukclk5WxsVZAZCGUVZCZAHPkxNWNaa0E3o6pD4AmHLMXALNVPEiXywQSQNENgfwG50dXsQWXOLZCQ4PsYCRs7XmxjHDjEVZC66YhYBPsrlBkITg9JdLABTmWBdC82efk2',
    };

    const instagramResponse = await axios.post(`https://graph.facebook.com/v14.0/17841461851346646/media`, instagramParams);
    const creationId = instagramResponse.data.id;

    // Publish the media creation to Instagram
    const publishResponse = await axios.post(`https://graph.facebook.com/v14.0/17841461851346646/media_publish`, {
      creation_id: creationId,
      access_token: 'EAADLqeAjhXEBOZCgFiysRVtZBxY505GYrIBkCdEiOWZB5ZAU13YlmgvAf7Emb2LB3aWdCqmwPKCOzukclk5WxsVZAZCGUVZCZAHPkxNWNaa0E3o6pD4AmHLMXALNVPEiXywQSQNENgfwG50dXsQWXOLZCQ4PsYCRs7XmxjHDjEVZC66YhYBPsrlBkITg9JdLABTmWBdC82efk2'
    });

    return { message: 'Image posted successfully to Instagram', instagramPostId: publishResponse.data.id };
  } catch (error) {
    console.error("Error fetching random news article or creating image:", error);
    res.status(500).json({ error: 'An error occurred' });
  }
};



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
const { TwitterApi } = require('twitter-api-v2');

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
    const apiKey = '6dc35d202ab94573b73dfd925aa4b4a2';
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

        let data = await fetchNews(params);
        articles = data.articles;

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
        console.log('bilti', articles[0]);
        exports.createRandomNewsVideo(articles[0]);  // Assuming createRandomNewsImage is modified to accept an article object
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
    // Now use axios to  data to your own API to create an image
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
    console.log(captionDetails, imageUrl);

    const instagramParams = {
      image_url: imageUrl,
      caption: captionDetails,
      access_token: 'EAADLqeAjhXEBO7gFinHSGFYDyQQy8bv19nZApt1TkZBl1OuENijwYW3yh4hvPkRCdYTx62MMDpKe259NbUh0ZCZCH35v3R0epVCAL1bZCFj4ox2MDrjtZA60IEfaZAicWTyoYxChvHwFXJW5KWGBibtAlkxGRtkjSjDebP5A0QqjahVte37qYQl0edDHr064SlNnsC8vBoQ',
    };

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const instagramResponse = await axios.post('https://graph.facebook.com/v16.0/17841461851346646/media', instagramParams);
        console.log('Instagram Response:', instagramResponse.data);

        const creationId = instagramResponse.data.id;

        const publishResponse = await axios.post('https://graph.facebook.com/v16.0/17841461851346646/media_publish', {
          creation_id: creationId,
          access_token: 'EAADLqeAjhXEBO7gFinHSGFYDyQQy8bv19nZApt1TkZBl1OuENijwYW3yh4hvPkRCdYTx62MMDpKe259NbUh0ZCZCH35v3R0epVCAL1bZCFj4ox2MDrjtZA60IEfaZAicWTyoYxChvHwFXJW5KWGBibtAlkxGRtkjSjDebP5A0QqjahVte37qYQl0edDHr064SlNnsC8vBoQ',
        });

        return { message: 'Image posted successfully to Instagram', instagramPostId: publishResponse.data.id };
      } catch (error) {
        if (error.response && error.response.data.error && error.response.data.error.code === -2 && attempt < 3) {
          console.warn(`Attempt ${attempt} failed due to timeout. Retrying...`);
          await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds before retrying
        } else {
          throw error;
        }
      }
    }

    const twitterClient = new TwitterApi({
      appKey: 'EsvXmLGfoejga5MMv6EGlmS1Q',
      appSecret: 'upfILyXWYaqbRpjOcKVuw2bv6tq30eSR9ZA4WI8HIf4RXi9gqF',
      accessToken: '1703422723630964736-9anYfHb5FH5K5HssIlExfPhyBKk7ui',
      accessSecret: 'RsrOtWNWTJGs2JSu4ShgNuL2iWc4Ul3Z36mXcFQQEvMhQ',
    });

    const tweetText = `${conciseTitle}\n\n${captionDetails}\n\n${imageUrl}`;
    try {
      const tweet = await twitterClient.v2.tweet({
        text: `${article.description}`,
      });
      console.log('Tweet posted successfully', tweet);
    } catch (error) {
      console.error('Error posting tweet:', error.response ? error.response.data : error);
    }

    return { message: 'Image posted successfully to Instagram', instagramPostId: publishResponse.data.id };
  } catch (error) {
    console.error('Error creating image or posting to Instagram:', error.response ? error.response.data : error);
    // res.status(500).json({ error: 'An error occurred' });
  }
};


// Add your API keys here
const apiKeys = [
  '7a49a813a64d492e9eec3b2e6a5483a0',
  '44cc43a8bfae47a5bc9cd0dbff35e406',
  '93f4c59c9fd648fb8bd12c85c3c48350',
  '619448c0e5c64ef597138852ad331cc6',
  '0c9cae5d81a34a96b2450fcb68078f14',
  '307e1bb50d9a470f890df5280aab94b7',
  '4141c9c37c2d4c9492c3154692f316c1',
  '4925dfcf7ec84f5a97e55af95812cf60',
  '9e93e49561894827a9598b6b00018339',
  '04fc7417a23e435e9a53cccf862be2ca',
  '5eb6c1d605ff4d1aaef0a0753bc437c0',
  'e1c3df52a3d9439fa286ef24c11de7b6',
  '0d63ebcbbf464b8b8f4f5d44c2d80ad7',
  '6a010224af40489bbbb95b6f72702c0d',
  '2778ebc590834985b798a228345e9a83',
  'fc8787c5db404ddda0f7efc4c2120ff3'
  // ... add up to 20 keys
];
let currentApiKeyIndex = 0;
let apiKeyUsageCount = new Array(apiKeys.length).fill(0);

const getNextApiKey = () => {
  currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
  return apiKeys[currentApiKeyIndex];
};

const fetchNews = async (params) => {
  let attempts = 0;
  let maxAttempts = apiKeys.length;
  while (attempts < maxAttempts) {
    try {
      params.apiKey = apiKeys[currentApiKeyIndex];
      let response = await axios.get('https://newsapi.org/v2/top-headlines', { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`API key ${apiKeys[currentApiKeyIndex]} exceeded rate limit, switching to next API key.`);
        currentApiKeyIndex = (currentApiKeyIndex + 1) % apiKeys.length;
        attempts++;
      } else {
        throw error;
      }
    }
  }
  throw new Error('All API keys have exceeded the rate limit');
};

const fetchUSNewsAndCreateImage = async (retryCount = 0) => {
  try {
    const remainingQuota = await checkRateLimit();
    if (remainingQuota < 1) {
      console.warn('Rate limit too low, skipping posting.');
      return;
    }
    const countryCode = 'US';
    const countryName = 'United States';

    let page = 1;
    let articles = [];

    while (true) {
      const params = {
        country: countryCode,
        pageSize: 1,
        page: page++,
      };

      let data = await fetchNews(params);
      articles = data.articles;

      if (articles.length === 0) break;

      const articleTitles = articles.map(article => article.title);
      const sentArticles = await Article.find({ 'title': { $in: articleTitles }, 'url': { $in: articles.map(article => article.url) } });

      if (sentArticles.length === 0) break;
    }

    if (articles.length === 0) return;

    await Promise.all(articles.map(article => {
      const articleToSave = {
        source: {
          id: article.source.id,
          name: article.source.name,
        },
        author: article.author,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        content: article.content,
      };
      return Article.findOneAndUpdate({ url: article.url }, articleToSave, { upsert: true, new: true });
    }));

    if (articles.length > 0) {
      await exports.createRandomNewsImage(articles[0]);
    }
  } catch (error) {
    console.error('Error fetching US news or creating image:', error);
  }
};


cron.schedule('*/5 * * * *', async () => {
  console.log('Running fetchUSNewsAndCreateImage every 5 minutes');
  try {
    await fetchUSNewsAndCreateImage();
    // await findFollowing();
  } catch (error) {
    console.error('Error during scheduled task:', error);
  }
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata',
});

cron.schedule('0 0 * * *', () => {
  console.log('Resetting API key usage counters at midnight');
  apiKeyUsageCount.fill(0);
  currentApiKeyIndex = 0;
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata',
});

const checkRateLimit = async () => {
  const userId = '17841461851346646';  // Replace with your Instagram user ID
  const accessToken = 'EAADLqeAjhXEBO7gFinHSGFYDyQQy8bv19nZApt1TkZBl1OuENijwYW3yh4hvPkRCdYTx62MMDpKe259NbUh0ZCZCH35v3R0epVCAL1bZCFj4ox2MDrjtZA60IEfaZAicWTyoYxChvHwFXJW5KWGBibtAlkxGRtkjSjDebP5A0QqjahVte37qYQl0edDHr064SlNnsC8vBoQ';  // Replace with your access token

  try {
    const response = await axios.get(`https://graph.facebook.com/v16.0/${userId}/content_publishing_limit`, {
      params: {
        access_token: accessToken,
      },
    });
    const quota_limit = 35;
    const { quota_usage } = response.data.data[0];
    console.log(`Current quota usage: ${quota_usage}, quota limit: ${quota_limit}`);
    return quota_limit - quota_usage;
  } catch (error) {
    console.error('Error checking rate limit:', error.response ? error.response.data : error);
    return 0;  // Assume no remaining quota if there is an error
  }
};


exports.createRandomNewsVideo = async (article) => {
  try {
    // Generate a concise title using OpenAI
    const titleResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Create a concise title from this text: "${article.title}. ${article.description}. ${article.content}". Make sure that it is in 11-13 words as it will come on the pics that goes to instagram  Just give me the caption and nothing else. dnt mention here is the caption or anything else  just the content i want as it will directly go to customer. Also dont put the output in quotations and also make the title which is easy to understand` },
      ],
    });

    const conciseTitle = titleResponse.data.choices[0].message.content.trim();
    console.log(conciseTitle), `${article.urlToImage}, ${article.description}, ${article.publishedAt}`;
    // Now use axios to send data to your own API to create a video
    const videoResponse = await axios.post('https://optimamart.com/api/create-video-loop', {
      title: conciseTitle,
      urlToImage: article.urlToImage,
      description: article.description,
      publishedAt: article.publishedAt
    });
    console.log(videoResponse.data);

    // Assuming the video creation endpoint returns the URL of the created video
    const videoUrl = videoResponse.data.videoUrl;
    const captionResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Create a detailed 80-90 words caption and 25-30 relevant hashtags from this text: "${article.title}. ${article.description}. ${article.content}". Just give me the best summarization with details of it and give me the content straight, dont give me anything else such as this is the information or anything. Also dont mention caption or hashtags in the post  this will directly go to insta so dont make it feel like AI generated. Also dont put the caption in commas` },
      ],
    });

    const captionDetails = captionResponse.data.choices[0].message.content.trim();
    console.log(captionDetails, videoUrl);

    const instagramParams = {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: captionDetails,
      share_to_feed: true,
      access_token: 'EAADLqeAjhXEBO7gFinHSGFYDyQQy8bv19nZApt1TkZBl1OuENijwYW3yh4hvPkRCdYTx62MMDpKe259NbUh0ZCZCH35v3R0epVCAL1bZCFj4ox2MDrjtZA60IEfaZAicWTyoYxChvHwFXJW5KWGBibtAlkxGRtkjSjDebP5A0QqjahVte37qYQl0edDHr064SlNnsC8vBoQ',
    };

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const instagramResponse = await axios.post('https://graph.facebook.com/v19.0/17841461851346646/media', instagramParams);
        console.log('Instagram Response:', instagramResponse.data);

        const creationId = instagramResponse.data.id;
        await waitForMediaToBeReady(creationId, 'EAADLqeAjhXEBO7gFinHSGFYDyQQy8bv19nZApt1TkZBl1OuENijwYW3yh4hvPkRCdYTx62MMDpKe259NbUh0ZCZCH35v3R0epVCAL1bZCFj4ox2MDrjtZA60IEfaZAicWTyoYxChvHwFXJW5KWGBibtAlkxGRtkjSjDebP5A0QqjahVte37qYQl0edDHr064SlNnsC8vBoQ');

        const publishResponse = await axios.post('https://graph.facebook.com/v19.0/17841461851346646/media_publish', {
          creation_id: creationId,
          access_token: 'EAADLqeAjhXEBO7gFinHSGFYDyQQy8bv19nZApt1TkZBl1OuENijwYW3yh4hvPkRCdYTx62MMDpKe259NbUh0ZCZCH35v3R0epVCAL1bZCFj4ox2MDrjtZA60IEfaZAicWTyoYxChvHwFXJW5KWGBibtAlkxGRtkjSjDebP5A0QqjahVte37qYQl0edDHr064SlNnsC8vBoQ',
        });

        return { message: 'Video posted successfully to Instagram', instagramPostId: publishResponse.data.id };
      } catch (error) {
        if (error.response && error.response.data.error && error.response.data.error.code === -2 && attempt < 3) {
          console.warn(`Attempt ${attempt} failed due to timeout. Retrying...`);
          await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds before retrying
        } else {
          throw error;
        }
      }
    }

    return { message: 'Video posted successfully to Instagram', instagramPostId: publishResponse.data.id };
  } catch (error) {
    console.error('Error creating video or posting to Instagram:', error.response ? error.response.data : error);
  }
};


const waitForMediaToBeReady = async (creationId, accessToken) => {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const statusResponse = await axios.get(`https://graph.facebook.com/v16.0/${creationId}`, {
        params: {
          fields: 'status_code',
          access_token: accessToken
        }
      });

      if (statusResponse.data.status_code === 'FINISHED') {
        return;
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed with error: ${error.message}`);
    }

    // Wait for 5 seconds before the next attempt
    await new Promise(res => setTimeout(res, 5000));
  }

  throw new Error('Media processing timed out.');
};

const USERNAMES = ['girlalmighty_', 'optima.mart']; // Replace with actual usernames you want to monitor
const IG_BUSINESS_ACCOUNT_ID = '17841461851346646';  // Replace with your Instagram user ID
const ACCESS_TOKEN = 'EAADLqeAjhXEBO7gFinHSGFYDyQQy8bv19nZApt1TkZBl1OuENijwYW3yh4hvPkRCdYTx62MMDpKe259NbUh0ZCZCH35v3R0epVCAL1bZCFj4ox2MDrjtZA60IEfaZAicWTyoYxChvHwFXJW5KWGBibtAlkxGRtkjSjDebP5A0QqjahVte37qYQl0edDHr064SlNnsC8vBoQ';  // Replace with your access token


const getMediaFromUsername = async (username) => {
  try {
    const response = await axios.get(`https://graph.facebook.com/v16.0/${IG_BUSINESS_ACCOUNT_ID}`, {
      params: {
        fields: `business_discovery.username(${username}){followers_count,media_count,media{id,caption,comments_count,like_count}}`,
        access_token: ACCESS_TOKEN
      }
    });

    if (response.data.business_discovery && response.data.business_discovery.media) {
      return response.data.business_discovery.media.data;
    } else {
      throw new Error('Media data not found in response');
    }
  } catch (error) {
    console.error(`Error fetching media for ${username}:`, error.response ? error.response.data : error.message);
    return [];
  }
};




const findFollowing = async () => {


  try {
    const mediaPromises = USERNAMES.map(username => getMediaFromUsername(username));
    const mediaResponses = await Promise.all(mediaPromises);
    const mediaData = mediaResponses.flat(); // Flatten the array of arrays

    console.log(mediaData);
  } catch (error) {
    console.error('Error fetching user media:', error.response ? error.response.data : error.message);
    res.status(500).send('Server Error');
  }
}



// Exportable function to fetch articles and generate an answer using GPT
exports.getAnswerForQuestion = async (req, res) => {
  try {
    const question = req.body.question;
    const refinedQuestion = await refineQuestion(question);
    console.log(refinedQuestion);
    // Fetch articles from the News API
    const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: refinedQuestion,
        pageSize: 5,
        apiKey: '413790213a7649b3a555f7cddb12e7c0',
      },
    });

    const articles = newsResponse.data.articles;
    if (!articles.length) {
      return res.status(404).json({ error: 'No articles found.' });
    }

    // Combine the text from the articles
    const articlesText = articles.map(article => `${article.title}. ${article.description}. ${article.content}`).join(' ');
    // console.log(articlesText);
    // Generate an answer using OpenAI
    const answerResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        {
          role: 'user',
          content: `Based on the following text, answer the question: "${question}". Provide a detailed response with context, including any relevant reports or statements. Also, mention the actual stance on this issue. Here is the text: "${articlesText}". Just give me the answer directly without any additional information.`,
        },
      ],
    });

    const answer = answerResponse.data.choices[0].message.content.trim();

    res.json({ answer });
  } catch (error) {
    console.error('Error fetching articles or generating answer:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
};
const refineQuestion = async (question) => {
  const refinementResponse = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      {
        role: 'user',
        content: `Extract the top keywords from the following question for a news search: "${question}". Provide only the keywords, separated by commas.`,
      },
    ],
  });

  const refinedQuestion = refinementResponse.data.choices[0].message.content.trim();
  
  return refinedQuestion;
};
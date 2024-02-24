const News = require("../models/news");
const slugify = require("slugify");
const Tag = require('../models/tag');
const moment = require('moment');
const mongoose = require('mongoose');
const natural = require('natural');
const axios = require('axios');
const Article = require('../models/article');
const User = require('../models/user');

exports.create = async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
            const newProduct = await new News(req.body).save();
            res.json(newProduct);
        } else {
            res.status(400).json({
                err: 'No Title Found',
            });
        }

    } catch (err) {
        console.log(err);
        // res.status(400).send("Create product failed");
        res.status(400).json({
            err: err.message,
        });
    }
};

exports.list = async (req, res) =>
    res.json(await News.find({}).sort({ createdAt: -1 }).exec());


exports.saveNews = async (req, res) => {
    try {
        const tagsArray = req.body; // Assuming the array of tags is sent in the request body        

        for (const tag of tagsArray) {
            // Check if tag already exists to avoid duplicates
            const existingTag = await News.findOne({ title: tag.title }).exec();
            if (!existingTag) {
                const newTag = new News(tag);
                await newTag.save();
            }
        }

        return res.status(200).json({
            message: "All news have been saved successfully"
        });
    } catch (error) {
        console.error("Error saving tags:", error);
        return res.status(500).json({
            message: "Error saving tags",
            error: error
        });
    }
};

exports.readFeatured = async (req, res) => {
    try {

        let products = await Tag.find({ featured: true })
            .sort([["createdAt", "desc"]])
            .exec();

        return res.json(products);
    }
    catch (error) {
        console.error("Error saving tags:", error);
        return res.status(500).json({
            message: "Error reading tags",
            error: error
        });
    }
}


exports.getWeeklyNewsByTag = async (req, res) => {
    try {
        const startOfWeek = moment().startOf('week').toDate();
        const endOfWeek = moment().endOf('week').toDate();

        const newsByTag = await News.aggregate([
            // Match news in the current week
            { $match: { createdAt: { $gte: startOfWeek, $lte: endOfWeek } } },

            // Unwind the tags array
            { $unwind: "$tags" },

            // Group by each tag and get the first news item for each tag
            {
                $group: {
                    _id: "$tags",
                    news: { $first: "$$ROOT" }
                }
            },

            // Lookup to get tag details
            {
                $lookup: {
                    from: "tags", // Assuming the collection name in MongoDB is 'tags'
                    localField: "_id",
                    foreignField: "_id",
                    as: "tagDetails"
                }
            },

            // Unwind the tagDetails array
            { $unwind: "$tagDetails" },

            // Project the required fields
            {
                $project: {
                    _id: 0,
                    tagName: "$tagDetails.name",
                    news: 1
                }
            }
        ]);

        const createSummary = (description) => {
            const tokenizer = new natural.SentenceTokenizer();
            const sentences = tokenizer.tokenize(description);
            if (sentences.length > 0) {
                // Take the first sentence or part of it
                let firstSentence = sentences[0];
                let words = firstSentence.split(' ');
                if (words.length > 5) {
                    // Find a natural break in the first few words
                    let endIndex = words.slice(0, 6).findIndex(word => word.endsWith('.') || word.endsWith(',') || word.endsWith(';'));
                    if (endIndex !== -1) {
                        return words.slice(0, endIndex + 1).join(' ');
                    } else {
                        return words.slice(0, 5).join(' ') + '...';
                    }
                }
                return firstSentence;
            }
            return '';
        };

        // Add summary to each news item
        const newsWithSummary = newsByTag.map(item => ({
            ...item,
            news: {
                ...item.news,
                summary: createSummary(item.news.description)
            }
        }));

        res.json(newsWithSummary);
    } catch (error) {
        console.error("Error fetching weekly news by tag:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getTopNewsByCategory = async (req, res) => {
    try {
        const { country, page } = req.query;

        const categories = ['entertainment', 'business', 'health', 'politics', 'science', 'sports', 'technology', 'food'];

        // Only consider the first 'page' number of categories
        const categoriesToFetch = page ? categories.slice(0, page) : categories;

        // NewsAPI key
        const apiKey = 'e1c3df52a3d9439fa286ef24c11de7b6'; // Replace with your NewsAPI key

        // Fetch top news for each category within the page limit
        const newsData = await Promise.all(categoriesToFetch.map(async (category) => {
            const response = await axios.get('https://newsapi.org/v2/top-headlines', {
                params: {
                    country: country,
                    category: category,
                    pageSize: 1, // Only fetch one article per category
                    apiKey: apiKey
                }
            });

            // If there's no article for a category, return null or an empty object
            return {
                category: category,
                news: response.data.articles.length > 0 ? response.data.articles[0] : null // Take the first article from the response if it exists
            };
        }));

        // Filter out any categories that didn't have news to ensure the response only contains categories with news
        const filteredNewsData = newsData.filter(item => item.news !== null);

        // Filter out articles with '[Removed]'
        // filteredNewsData = filteredNewsData.filter(article => {
        //     return article.title !== '[Removed]' &&
        //         article.description !== '[Removed]' &&
        //         article.content !== '[Removed]';
        // });


        res.json(filteredNewsData);
    } catch (error) {
        console.error("Error fetching top news by category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.likePost = async (req, res) => {
    try {
        const { article, interest, isLiked } = req.body;

        const customer = await User.findOne({ email: req.user.email }).exec();
        const userId = customer._id;

        let foundArticle = await Article.findOne({ url: article.url });

        if (!foundArticle) {
            foundArticle = await new Article(article).save();
        }

        if (isLiked) {
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { likes: foundArticle._id } },
                { new: true }
            );

            const tag = await Tag.findOne({ name: interest });

            if (tag) {
                const user = await User.findById(userId);

                const tagExists = user.tags.some(t => t.tag.toString() === tag._id.toString());

                if (tagExists) {
                    // Increment the score for the tag
                    await User.findByIdAndUpdate(
                        userId,
                        { $inc: { "tags.$[elem].score": 1 } },
                        { 
                            arrayFilters: [{ "elem.tag": tag._id }],
                            new: true 
                        }
                    );
                } else {
                    // Add the tag with an initial score
                    await User.findByIdAndUpdate(
                        userId,
                        { $push: { tags: { tag: tag._id, score: 1 } } },
                        { new: true }
                    );
                }
            }
        } else {
            await User.findByIdAndUpdate(
                userId,
                { $pull: { likes: foundArticle._id } },
                { new: true }
            );
            // Logic for unliking can be similarly adjusted
        }

        res.json({ message: isLiked ? 'Article liked' : 'Article unliked' });

    } catch (error) {
        console.error("Error in likePost function:", error);
        return res.status(500).json({
            message: "Error processing like/unlike",
            error: error
        });
    }
};

exports.updateUserInterest = async (req, res) => {
    try {
        const { userId, interestName } = req.body;

        // Find the tag by its name (interestName)
        const tag = await Tag.findOne({ name: interestName });

        if (!tag) {
            // Handle the case where the tag doesn't exist
            return res.status(404).json({ message: "Tag not found" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const tagExists = user.tags.some(t => t.tag.toString() === tag._id.toString());

        if (tagExists) {
            // Increment the score for the tag
            await User.findByIdAndUpdate(
                userId,
                { $inc: { "tags.$[elem].score": 1 } },
                { 
                    arrayFilters: [{ "elem.tag": tag._id }],
                    new: true 
                }
            );
        } else {
            // Add the tag with an initial score
            await User.findByIdAndUpdate(
                userId,
                { $push: { tags: { tag: tag._id, score: 1 } } },
                { new: true }
            );
        }

        res.json({ message: "Interest updated successfully" });

    } catch (error) {
        console.error("Error in updateUserInterest function:", error);
        return res.status(500).json({
            message: "Error updating interest",
            error: error
        });
    }
};


exports.refreshUserInterest = async (req, res) => {
    try {
        const { userId, interestScores } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update the user's interest scores
        user.interestScores = interestScores;
        await user.save();

        res.send('Interest scores updated successfully');
    } catch (error) {
        res.status(500).send('Error updating interest scores');
    }
};

exports.weatherSearch = async (req, res) => {
    const { city } = req.query;
    try {
        const cityName = city;
        const apiKey = '13ceccb2332d4493849112500241701'; 
        const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${cityName}`;

        const response = await axios.get(url);
        const weatherData = translateWeatherData(response.data);

        console.log('Weather Data:', weatherData);

        res.json(weatherData);
    } catch (error) {
        // Handle the error appropriately
        res.status(500).send('Error fetching weather data');
    }
};

function translateWeatherData(weatherData) {
    const { location, current } = weatherData;

    return {
        location: `${location.name}, ${location.region}, ${location.country}`,
        lastUpdated: current.last_updated,
        temperatureC: current.temp_c,
        temperatureF: current.temp_f,
        feelsLikeC: current.feelslike_c,
        feelsLikeF: current.feelslike_f,
        condition: current.condition.text,
        windKph: current.wind_kph,
        windMph: current.wind_mph,
        windDir: current.wind_dir,
        pressureMb: current.pressure_mb,
        pressureIn: current.pressure_in,
        humidity: current.humidity,
        visibilityKm: current.vis_km,
        visibilityMiles: current.vis_miles,
        uvIndex: current.uv,
        uvCategory: uvIndexCategory(current.uv),
        precipitationMm: current.precip_mm,
        cloudCover: current.cloud
    };
}

function uvIndexCategory(uvIndex) {
    if (uvIndex < 3) return 'low';
    if (uvIndex < 6) return 'moderate';
    if (uvIndex < 8) return 'high';
    if (uvIndex < 11) return 'very high';
    return 'extreme';
}


exports.weatherForecastSearchSimple = async (req, res) => {
    const { city } = req.query;
    try {
        const cityName = city;
        const apiKey = '13ceccb2332d4493849112500241701';
        const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${cityName}&days=7`;

        const response = await axios.get(url);
        const simpleForecastData = translateSimpleForecastData(response.data);

        console.log('Simple Forecast Data:', simpleForecastData);

        res.json(simpleForecastData);
    } catch (error) {
        res.status(500).send('Error fetching forecast data');
    }
};

function translateSimpleForecastData(forecastData) {
    const { location, forecast } = forecastData;
    const simpleFormattedForecast = forecast.forecastday.map(day => ({
        date: day.date,
        maxTempC: day.day.maxtemp_c,
        minTempC: day.day.mintemp_c,
        maxTempF: day.day.maxtemp_f,
        minTempF: day.day.mintemp_f,
        condition: day.day.condition.text, // Including the condition text in the data
    }));

    return {
        location: `${location.name}, ${location.region}, ${location.country}`,
        forecast: simpleFormattedForecast
    };
}
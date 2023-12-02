const News = require("../models/news");
const slugify = require("slugify");
const Tag = require('../models/tag');
const moment = require('moment');
const mongoose = require('mongoose');
const natural = require('natural');
const axios = require('axios');

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

        const categories = ['entertainment', 'business', 'health', 'politics', 'science', 'sports', 'technology', 'food' ]; 

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

        res.json(filteredNewsData);
    } catch (error) {
        console.error("Error fetching top news by category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

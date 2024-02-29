const Tag = require("../models/tag");
const Guest = require('../models/guest')
const axios = require('axios');
const mongoose = require("mongoose");


exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        res.json(await new Tag(req.body).save());
    } catch (err) {
        // console.log(err);
        res.status(400).send("Create Tag failed");
    }
};


exports.list = async (req, res) =>
    res.json(await Tag.find({}).sort({ createdAt: -1 }).exec());


exports.readTag = async (req, res) => {
    let category = await Tag.findOne({ _id: req.params.slug }).exec();
    // res.json(category);

    return res.json(category);
};

exports.update = async (req, res) => {
    try {
        const updated = await Tag.findOneAndUpdate(
            { _id: req.params.slug },
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).send("Tag update failed");
    }
};


exports.saveTags = async (req, res) => {
    try {
        const tagsArray = req.body; // Assuming the array of tags is sent in the request body        

        for (const tag of tagsArray) {
            // Check if tag already exists to avoid duplicates
            const existingTag = await Tag.findOne({ name: tag.name }).exec();
            if (!existingTag) {
                const newTag = new Tag(tag);
                await newTag.save();
            }
        }

        return res.status(200).json({
            message: "All tags have been saved successfully"
        });
    } catch (error) {
        console.error("Error saving tags:", error);
        return res.status(500).json({
            message: "Error saving tags",
            error: error
        });
    }
};


exports.read = async (req, res) => {
    const { country, code, page } = req.query;

    try {
        let tag = await Tag.findOne({ _id: req.params.slug }).exec();

        if (!tag) {
            return res.status(404).json({ message: "Tag not found" });
        }
        console.log(tag.name, code, country);
        // First, try fetching top headlines
        let response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: {
                category: tag.name,
                country: code,
                pageSize: 2,
                page: page,
                apiKey: '4141c9c37c2d4c9492c3154692f316c1' // Replace with your actual API key
            }
        });

        let news = response.data.articles;

        if (!news || news.length === 0) {
            response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: `${tag.name} AND ${country}`,
                    sortBy: 'relevancy',
                    pageSize: 2,
                    page: page,
                    apiKey: '4141c9c37c2d4c9492c3154692f316c1' // Replace with your actual API key
                }
            });

            news = response.data.articles;
        }

        res.json({
            tag: tag,
            news: news
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
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

exports.readByInterests = async (req, res) => {
    const { country, code, page } = req.query;
    let { interest } = req.body.interest;

    console.log('balle', req.query);

    try {
        const apiKey = '619448c0e5c64ef597138852ad331cc6';
        let articles;

        const tags = await Tag.find({}).sort({ createdAt: -1 }).exec();

        // Check if interest is null and fetch a random tag if it is
        if (interest === 'null') {
            if (tags.length > 0) {
                const randomTag = tags[Math.floor(Math.random() * tags.length)];
                interest = randomTag.name;
            } else {
                return res.status(404).json({ message: "No categories found" });
            }
        } else {
            if (Math.random() > 0.5 && tags.length > 0) {
                // Pick a random tag from the tags array
                const randomTag = tags[Math.floor(Math.random() * tags.length)];
                interest = randomTag.name;
            }
        }

        console.log('Selected Interest:', interest);

        // Fetch top headlines for the selected interest
        let response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: {
                category: `${interest}`,
                country: code,
                pageSize: 2,
                page: page,
                apiKey: apiKey
            }
        });

        articles = response.data.articles;
        console.log('eturgrul', response.data);

        // Fall back to 'everything' query if no news found
        if (!articles || articles.length === 0) {
            console.log('everything news');
            response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: `${interest} AND ${country}`,
                    // country: code,
                    sortBy: 'publishedAt',
                    pageSize: 2,
                    page: page,
                    language: 'en',
                    apiKey: apiKey
                }
            });

            articles = response.data.articles;
        }

        res.json({
            category: interest,
            news: articles
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.readLocalNews = async (req, res) => {
    const { city, country, page, number } = req.query;

    console.log('balle', req.query);

    try {
        const apiKey = '619448c0e5c64ef597138852ad331cc6';

        response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: `${city} AND ${country}`,
                sortBy: 'publishedAt',
                pageSize: page,
                page: number,
                language: 'en',
                apiKey: apiKey
            }
        });

        let articles = response.data.articles;

        res.json({
            news: articles
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateTagStats = async (req, res) => {
    try {
        const { tagId, uniqueId } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date to midnight for consistency

        // Convert tagId to ObjectId if necessary
        const objectId = mongoose.Types.ObjectId(tagId);

        // First, update the tag's trendScore
        let result = await Tag.updateOne(
            { _id: objectId, "trendScore.date": { $eq: today } },
            { $inc: { "trendScore.$.score": 1 } }
        );

        // If today's date score doesn't exist, add it
        if (result.matchedCount === 0) {
            result = await Tag.updateOne(
                { _id: objectId },
                { $push: { trendScore: { date: today, score: 1 } } },
                { upsert: true }
            );
        }

        // Now, update the Guest's interestScore
        const guestResult = await Guest.findOneAndUpdate(
            { _id: uniqueId, "interestScore.tag": objectId },
            { $inc: { "interestScore.$.score": 1 } },
            { new: true }
        );

        // If the tag isn't found in the Guest's interestScore, add it
        if (!guestResult) {
            await Guest.findOneAndUpdate(
                { _id: uniqueId },
                { $push: { interestScore: { tag: objectId, score: 1 } } },
                { new: true }
            );
        }

        console.log('result', result); // Log to debug
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.getTrendingTags = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch tags that are trending today
        let trendingTags = await Tag.aggregate([
            { $match: { "trendScore.date": { $eq: today } } },
            { $limit: 8 } // Assuming you define "trending" as having a trendScore for today
        ]);

        if (trendingTags.length < 8) {
            // Calculate how many more tags are needed to make up 8
            const tagsNeeded = 8 - trendingTags.length;

            // Fetch random tags to make up the difference
            // Note: $sample may return the same tags as in trendingTags. Additional logic needed to exclude them if necessary
            const randomTags = await Tag.aggregate([
                { $match: { _id: { $nin: trendingTags.map(tag => tag._id) } } }, // Exclude already selected trending tags
                { $sample: { size: tagsNeeded } }
            ]);

            // Combine trending tags with random tags
            trendingTags = trendingTags.concat(randomTags);
        }

        console.log(trendingTags);

        res.json(trendingTags);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

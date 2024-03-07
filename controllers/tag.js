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
                pageSize: 4,
                page: page,
                apiKey: '04fc7417a23e435e9a53cccf862be2ca' // Replace with your actual API key
            }
        });

        let news = response.data.articles;

        if (!news || news.length === 0) {
            response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: `${tag.name} AND ${country}`,
                    sortBy: 'publishedAt',
                    pageSize: 4,
                    page: page,
                    language: 'en',
                    apiKey: '04fc7417a23e435e9a53cccf862be2ca' // Replace with your actual API key
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
        const apiKey = '04fc7417a23e435e9a53cccf862be2ca';
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
            if (Math.random() > 0.75 && tags.length > 0) {
                const randomTag = tags[Math.floor(Math.random() * tags.length)];
                interest = randomTag.name;
            }
        }
        const randomPage = Math.floor(Math.random() * 30) + 1;

        let params;
        // If page is even, request top headlines without specifying category
        if (page % 2 === 0) {
            params = {
                country: code,
                pageSize: 2,
                page: randomPage,
                apiKey: apiKey
            };
        } else { // If page is odd, request top headlines for the selected interest
            params = {
                category: interest,
                country: code,
                pageSize: 2,
                page: page,
                apiKey: apiKey
            };
        }

        // Fetch top headlines based on the parameters set above
        let response = await axios.get('https://newsapi.org/v2/top-headlines', { params });

        articles = response.data.articles;
        console.log('eturgrul', response.data);

        // Fall back to 'everything' query if no news found
        if (!articles || articles.length === 0) {
            console.log('everything news');
            response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: `${interest} AND ${country}`,
                    sortBy: 'popularity',
                    pageSize: 2,
                    page: page,
                    language: 'en',
                    apiKey: apiKey
                }
            });

            articles = response.data.articles;
        }

        res.json({
            category: page % 2 === 0 ? 'Top Headlines' : interest,
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
    const { user } = req.query;
    console.log(user);
    try {
        let tagsToFetch = 8; // Total number of tags we aim to fetch

        // Initialize arrays to hold IDs of selected tags
        let topInterestTagIds = [];
        let finalTagDocuments = [];

        // Fetch the Guest document, including interest scores
        const guest = await Guest.findById(user).lean(); // `.lean()` for performance, since we just read data

        if (guest && guest.interestScore && guest.interestScore.length > 0) {
            // Sort interest scores by 'score' in descending order and get the top up to 3
            topInterestTagIds = guest.interestScore.sort((a, b) => b.score - a.score).slice(0, 3).map(score => score.tag);
            tagsToFetch -= topInterestTagIds.length; // Reduce the number of tags to fetch accordingly

            // Fetch the full tag documents for these top interest tags
            finalTagDocuments = await Tag.find({ _id: { $in: topInterestTagIds } });
        }

        console.log(finalTagDocuments);



        // Now, let's fetch trending tags, excluding any top interest tags already selected
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let trendingTags = [];
        if (tagsToFetch > 0) {
            trendingTags = await Tag.aggregate([
                { $match: { "trendScore.date": { $eq: today }, _id: { $nin: topInterestTagIds } } },
                { $limit: tagsToFetch }
            ]);

            // Add the fetched trending tags to the final list
            finalTagDocuments.push(...trendingTags);
        }
        // If we still don't have enough tags, fetch additional random tags
        if (finalTagDocuments.length < 8) {
            const tagsStillNeeded = 8 - finalTagDocuments.length;
            const allSelectedTagIds = [...topInterestTagIds, ...trendingTags.map(tag => tag._id)]; // Combine IDs from both sources

            const randomTags = await Tag.aggregate([
                { $match: { _id: { $nin: allSelectedTagIds } } },
                { $sample: { size: tagsStillNeeded } }
            ]);

            // Add these random tags to the final list
            finalTagDocuments.push(...randomTags);
        }
        res.json(finalTagDocuments);
    }  catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.updateInterestScores = async (req, res) => {
    try {
        const { interestScores: interestScoresString, guestId } = req.body;
        const interestScores = JSON.parse(interestScoresString); // Assuming interestScores is a JSON string
        
        const guestObjectId = mongoose.Types.ObjectId(guestId);
        
        // Find or create the guest document
        let guest = await Guest.findById(guestObjectId) || new Guest({ _id: guestObjectId });

        // Update each interest score
        for (const [tagName, score] of Object.entries(interestScores)) {
            // Find the Tag document by name to get its ObjectId
            const tag = await Tag.findOne({ name: tagName });
            if (tag) {
                const tagObjectId = tag._id;
                const interestIndex = guest.interestScore.findIndex(item => item.tag.equals(tagObjectId));

                if (interestIndex > -1) {
                    // Interest exists, increment its score
                    guest.interestScore[interestIndex].score += score;
                } else {
                    // New interest, add it to the array
                    guest.interestScore.push({ tag: tagObjectId, score });
                }
            } else {
                console.log(`Tag not found for name: ${tagName}`);
                // Optionally handle the case where the tag doesn't exist in the Tag collection
            }
        }

        await guest.save(); // Save the updated guest document
        res.json({ message: "Interest scores updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


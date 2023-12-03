const Tag = require("../models/tag");
const News = require('../models/news')
const axios = require('axios');


exports.list = async (req, res) =>
    res.json(await Tag.find({}).sort({ createdAt: -1 }).exec());


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
    const { code, page } = req.query;

    try {
        let tag = await Tag.findOne({ _id: req.params.slug }).exec();
        
        if (!tag) {
            return res.status(404).json({ message: "Tag not found" });
        }

        // First, try fetching top headlines
        let response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: {
                country: code,
                category: tag.name, // Assuming 'name' is the field in the Tag model containing the tag's name
                pageSize: 1,
                page: page,
                apiKey: 'e1c3df52a3d9439fa286ef24c11de7b6' // Replace with your actual API key
            }
        });

        let news = response.data.articles;

        // If top headlines query returns no news, use the everything query
        if (!news || news.length === 0) {
            response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: tag.name, // Assuming 'name' is the field in the Tag model containing the tag's name
                    sortBy: 'popularity',
                    pageSize: 1,
                    page: page,
                    apiKey: 'e1c3df52a3d9439fa286ef24c11de7b6' // Replace with your actual API key
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
    const { code, page } = req.query;
    let { interest } = req.body;

    try {
        const apiKey = '04fc7417a23e435e9a53cccf862be2ca';
        let articles;

        // Decide whether to use the user's interest or a random category
        // 80% chance to use user's interest, 20% chance for random
        const useUserInterest = !interest || Math.random() < 0.8;

        if (!useUserInterest) {
            // Fetch random category from the database
            const tags = await Tag.find({}).sort({ createdAt: -1 }).exec();
            if (tags.length > 0) {
                const randomTag = tags[Math.floor(Math.random() * tags.length)];
                interest = randomTag.name;
            } else {
                return res.status(404).json({ message: "No categories found" });
            }
        }

        console.log('ent', interest);
        

        // Fetch top headlines for the selected interest or random category
        let response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: {
                country: code,
                category: interest,
                pageSize: 1, 
                page: page,
                apiKey: apiKey
            }
        });

        articles = response.data.articles;

        // Fall back to 'everything' query if no news found
        if (!articles || articles.length === 0) {
            response = await axios.get('https://newsapi.org/v2/everything', {
                params: {
                    q: interest,
                    sortBy: 'popularity',
                    pageSize: 1,
                    page: page,
                    apiKey: apiKey
                }
            });

            articles = response.data.articles;
        }

        res.json({
            category: interest,
            news: articles,
            usedUserInterest: useUserInterest
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

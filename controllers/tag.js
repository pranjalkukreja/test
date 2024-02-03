const Tag = require("../models/tag");
const News = require('../models/news')
const axios = require('axios');


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
                apiKey: '04fc7417a23e435e9a53cccf862be2ca' // Replace with your actual API key
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
    const { code, page } = req.query;
    let { interest } = req.body.interest;

    console.log(interest);

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
                // Pick a random tag from the tags array
                const randomTag = tags[Math.floor(Math.random() * tags.length)];
                interest = randomTag.name;
            }
        }

        console.log('Selected Interest:', interest);

        // Fetch top headlines for the selected interest
        let response = await axios.get('https://newsapi.org/v2/top-headlines', {
            params: {
                country: code,
                category: interest,
                pageSize: 2,
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
                    pageSize: 2,
                    page: page,
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

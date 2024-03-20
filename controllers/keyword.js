const Tag = require('../models/tag');
const moment = require('moment');
const mongoose = require('mongoose');
const Keyword = require('../models/keyword');

exports.create = async (req, res) => {
    try {
        // Check for 'keyword' in the request body
        if (req.body.keyword) {
            // Directly create a new Keyword document from the request body
            const newKeyword = await new Keyword(req.body).save();
            res.json(newKeyword); // Respond with the newly created document
        } else {
            res.status(400).json({
                error: 'No Keyword Found', // Provide a helpful error message
            });
        }
    } catch (err) {
        console.error(err); // Log the error to the console for debugging
        res.status(400).json({
            error: err.message, // Send back a JSON response with the error message
        });
    }
};

exports.list = async (req, res) =>
    res.json(await Keyword.find({}).sort({ createdAt: -1 }).exec());

exports.read = async (req, res) => {
    try {
        const keyword = await Keyword.findById(req.params._id);
        console.log(keyword);
        res.json(keyword);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

exports.update = async (req, res) => {
    try {
        const keyword = await Keyword.findByIdAndUpdate(req.params._id, req.body, { new: true });
        res.json(keyword);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

exports.findKeywordsWithFAQs = async (req, res) => {
    try {
        const { keywords } = req.body;
        console.log(keywords);
        // Check if keywords array is provided and is not empty
        if (!keywords || keywords.length === 0) {
            return res.status(400).json({ error: 'No keywords provided' });
        }

        // Find all keywords in the database that match any of the provided keywords
        const foundKeywords = await Keyword.find({
            keyword: { $in: keywords }
        });

        // If no matching keywords found, return an empty array
        if (foundKeywords.length === 0) {
            return res.json([]);
        }

        // Transform the found keywords to include only the necessary information (keyword, questions, and answers)
        const results = foundKeywords.map(kw => ({
            keyword: kw.keyword,
            FAQs: kw.FAQs.map(faq => ({
                question: faq.question,
                answers: faq.answers.map(ans => ans.value) // Assuming you just want the answer values
            }))
        }));
        console.log(results);

        // Send the transformed data back to the frontend
        res.json(results);

    } catch (error) {
        console.error('Failed to find keywords with FAQs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

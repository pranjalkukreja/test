const Tag = require('../models/tag');
const moment = require('moment');
const mongoose = require('mongoose');
const Keyword = require('../models/keyword');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

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
    if (!keywords || keywords.length === 0) {
      return res.status(400).json({ error: 'No keywords provided' });
    }
    // keywords = keywords.map(keyword => keyword.toLowerCase());

    for (const keywordText of keywords) {
      let keyword = await Keyword.findOne({ keyword: keywordText });

      if (keyword && keyword.FAQs.length === 0) {
        // Generate FAQ for the keyword
        const qaResponse = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: `Generate a most commonly asked question and an answer about: ${keywordText}. Make sure to write Answer: before the answer, and the answer has to be in 60 words or less.` },
          ],
        });

        const qaText = qaResponse.data.choices[0].message.content.trim();
        const [question, answer] = qaText.split("Answer:").map(part => part.trim());

        // Update the keyword with the generated FAQ
        keyword.FAQs.push({ question, answers: [{ value: answer }] });
        await keyword.save();
      }
    }

    // Retrieve updated keywords with FAQs
    const updatedKeywords = await Keyword.find({
      keyword: { $in: keywords },
    });

    const results = updatedKeywords.map(kw => ({
      keyword: kw.keyword,
      FAQs: kw.FAQs.map(faq => ({
        question: faq.question,
        answers: faq.answers.map(ans => ans.value),
      })),
    }));

    res.json(results);
  } catch (error) {
    console.error('Failed to find keywords with FAQs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.analyzeKeywords = async (req, res) => {
    try {
      const { title } = req.body.data;
      const words = title.split(/\s+/);
      let potentialKeywords = new Set();
  
      for (let start = 0; start < words.length; start++) {
        let combo = words[start];
        potentialKeywords.add(combo.toLowerCase()); // Add the single word first
  
        for (let end = start + 1; end < words.length; end++) {
          combo += " " + words[end];
          potentialKeywords.add(combo.toLowerCase()); // Add each combination
        }
      }
  
      // Convert potentialKeywords to an array to use in database query
      const potentialKeywordsArray = Array.from(potentialKeywords);
      const existingKeywords = await Keyword.find({
        keyword: { $in: potentialKeywordsArray }
      });
  
      // Extract keywords from found documents, ensuring uniqueness
      const foundKeywords = new Set(existingKeywords.map(kw => kw.keyword));
  
      if (foundKeywords.size > 0) {
        // Return found keywords
        return res.json({ success: true, keywords: Array.from(foundKeywords) });
      } else {
        const subjectsResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are a helpful assistant." },
              { role: "user", content: `What are the main unique subjects keywords of this title: "${title}"? Just include keywords that would be unique for customers to understand and dont include any other comments. Just Keyword1, keyword2, Keyword3. Remember to us commas and use no other words other than keywords themselves and make sure all are in lower case. Choose topics that might be interesting for reader/children to know about` },
            ],
          });
    
          const newSubjects = subjectsResponse.data.choices[0].message.content.trim().split(", ");
    
          // Iterate over each new subject to generate FAQs
          for (const subject of newSubjects) {
            const keywordExists = await Keyword.findOne({ keyword: subject.toLowerCase() });

            if (!keywordExists) {
                // Save the new keyword to your database
                const newKeyword = new Keyword({ keyword: subject.toLowerCase() });
                await newKeyword.save();
            }
          }
    
          res.json({ success: true, message: "Keywords and FAQs analyzed and generated.", keywords: newSubjects });
      }
    } catch (error) {
      console.error("Error during analyzing:", error);
      res.status(500).json({ success: false, error: 'Handling error details' });
    }
  };
  
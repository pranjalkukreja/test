const axios = require('axios');
const Search = require('../models/search'); // Ensure this path is correct
const User = require('../models/user');

exports.recordSearchTerm = async (req, res) => {
  try {
    const { term, user, page } = req.body;
    const { country } = req.query;
    const apiKey = 'e1c3df52a3d9439fa286ef24c11de7b6';

    // Save the search term with the user ID only if it's the first page
    if (page === 1 || !page) {
      const search = new Search({
        searchTerm: term,
        userId: user || null,
        country: country || null
      });
      await search.save();

      // Update user's interest scores if user ID is provided
      if (user) {
        await User.findByIdAndUpdate(
          user, 
          { $inc: { [`interestScores.${term}`]: 1 } }, 
          { new: true, upsert: true }
        );
      }
    }

    // Fetch news using 'everything' endpoint with pagination
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: term,
        sortBy: 'publishedAt',
        pageSize: 4,
        page: page || 1,
        apiKey: apiKey,
        language: 'en'
      }
    });

    let articles = response.data.articles;

    // Filter out articles with '[Removed]'
    articles = articles.filter(article => {
      return article.title !== '[Removed]' &&
             article.description !== '[Removed]' &&
             article.content !== '[Removed]';
    });
    // Sort articles from newest to oldest (optional, if needed)
    // articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Respond with the fetched news articles
    res.json({
      searchTerm: term,
      news: articles,
      page: page || 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSearchStats = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const searchStats = await Search.aggregate([
      // { $match: { createdAt: { $gte: oneDayAgo } } },
      { $group: { _id: "$searchTerm", count: { $sum: 1 } } },
      { $sort: { count: -1 } } // Optional: sort by most searched terms
    ]);
    res.status(200).json({ searchStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getSearchReport = async (req, res) => {
  try {
      const { country } = req.query;

      // Build the aggregation pipeline
      const pipeline = [
          {
              $match: { country: country } // Filter by the specified country
          },
          {
              $group: {
                  _id: "$searchTerm", // Group by the searchTerm field
                  count: { $sum: 1 } // Count the number of occurrences
              }
          },
          { $sort: { count: -1 } } // Sort by count in descending order
      ];

      // If no specific country is provided, remove the $match stage
      if (!country) {
          pipeline.shift();
      }

      const searchReport = await Search.aggregate(pipeline);

      res.json({
          message: "Search report for " + (country ? country : "all countries"),
          data: searchReport
      });

  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
  }
};



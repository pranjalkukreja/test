const axios = require('axios');
const Search = require('../models/search'); // Ensure this path is correct
const User = require('../models/user');
const Tag = require('../models/tag')

exports.recordSearchTerm = async (req, res) => {
  try {
    const { term, user, page } = req.body;
    const { country } = req.query;
    const apiKey = '04fc7417a23e435e9a53cccf862be2ca';
    console.log(req.body);

    if (term == '') {
      return
    }
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
        q: `${term}`,
        // searchIn: country,
        sortBy: 'publishedAt',
        pageSize: 5,
        page: page,
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

    // Group articles by source
    const groupedBySource = articles.reduce((acc, article) => {
      const sourceId = article.source.id;
      if (!acc[sourceId]) {
        acc[sourceId] = [];
      }
      acc[sourceId].push(article);
      return acc;
    }, {});

    // Create a cycle of articles from different sources
    const articleCycle = [];
    let done = false;
    while (!done) {
      done = true;
      for (const source in groupedBySource) {
        if (groupedBySource[source].length > 0) {
          articleCycle.push(groupedBySource[source].shift());
          done = false;
        }
      }
    }


    res.json({
      searchTerm: term,
      news: articleCycle,
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

    const filteredSearchReport = searchReport.filter(item => item.count > 10);

    for (let item of filteredSearchReport) {
      let searchTerm = item._id;
      let itemCountry = country;
      // Check if a tag already exists for this searchTerm
      let existingTag = await Tag.findOne({ name: searchTerm });

      if (existingTag) {
        // If tag exists but does not include the current country, push the new country code
        if (itemCountry && !existingTag.countryCode.includes(itemCountry)) {
          existingTag.countryCode.push(itemCountry);
          await existingTag.save();
          console.log(`Updated tag "${searchTerm}" with new country code "${itemCountry}".`);
        }
      } else {
        // If no tag exists, create a new one with the country code as an array
        const newTag = new Tag({
          name: searchTerm,
          countryCode: itemCountry ? [itemCountry] : [],
          emoji: '📰' // Or any default emoji/icon you wish to assign
        });

        await newTag.save(); // Save the new tag to the database
        console.log(`New tag created for search term "${searchTerm}" with ${item.count} occurrences.`);
      }
    }


    res.json({
      message: "Search report for " + (country ? country : "all countries"),
      data: searchReport
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



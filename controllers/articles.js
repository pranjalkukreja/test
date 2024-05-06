const User = require("../models/user");
const Article = require('../models/article');
const Guest = require('../models/guest');
const mongoose = require("mongoose");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.list = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10; // Default to 10 items per page

    const skip = (page - 1) * limit;

    const articles = await Article.find({})
      .sort({ publishedAt: -1 }) // Sorting by 'publishedAt' descending
      .skip(skip)
      .limit(limit)
      .exec();

    const totalCount = await Article.countDocuments();

    res.json({
      data: articles,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error listing articles with pagination:", error);
    res.status(500).json({ error: 'An error occurred while fetching articles' });
  }
};

exports.productStar = async (req, res) => {
  const product = await Article.findById(req.params.productId).exec();
  const { star, guest, comment } = req.body;
  const user = await Guest.findOne({ _id: guest }).exec();

  // check if currently logged in user have already added rating to this product?
  let existingRatingObject = product.ratings.find(
    (ele) => ele.postedBy.toString() === user._id.toString()
  );

  // if user haven't left rating yet, push it
  if (existingRatingObject === undefined) {
    let ratingAdded = await Article.findByIdAndUpdate(
      product._id,
      {
        $push: { ratings: { star, comment, postedBy: user._id } },
      },
      { new: true }
    ).exec();
    console.log("ratingAdded", ratingAdded);
    res.json(ratingAdded);
  } else {
    // if user have already left rating, update it
    const ratingUpdated = await Article.updateOne(
      {
        ratings: { $elemMatch: existingRatingObject },
      },
      { $set: { "ratings.$.star": star, "ratings.$.comment": comment } },
      { new: true }
    ).exec();
    console.log("ratingUpdated", ratingUpdated);
    res.json(ratingUpdated);
  }
};

exports.rephraseNews = async (req, res) => {
    const { source, author, title, description, url, urlToImage, publishedAt, content } = req.body;

    try {
        // Check if the article already exists by its URL
        let article = await Article.findOne({ url });
        
        const rephraseResponse = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant trained to rephrase text." },
                { role: "user", content: `Please rephrase the following description in a concise and engaging way: "${description} and ${content}" Remembe to summarize in 60 words or less and be as direct and short as possible. Dont write anything else in your result except the content itself, what you will give will directly go to my customers so dont give anything else except the content` }
            ]
        });

        const rephrasedDescription = rephraseResponse.data.choices[0].message.content;

        console.log(rephrasedDescription);
        if (article) {
            // If article exists, update the description
            article.description = rephrasedDescription;
            await article.save();
            res.json({
                message: "Article updated successfully with rephrased description",
                article
            });
        } else {
            // If article does not exist, create a new one
            article = new Article({
                source,
                author,
                title,
                description: rephrasedDescription,  // Use the rephrased description
                url,
                urlToImage,
                publishedAt,
                content
            });
            await article.save();
            res.json({
                message: "New article created successfully with rephrased description",
                article
            });
        }
    } catch (error) {
        console.error('Error handling the article:', error);
        res.status(500).json({ message: "Failed to process the article due to an error." });
    }
};

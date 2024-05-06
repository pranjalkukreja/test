const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const articleSchema = new mongoose.Schema({
    source: {
        id: String,
        name: String
    },
    author: String,
    title: {
        type: String,
        required: true
    },
    description: String,
    url: {
        type: String,
        required: true
    },
    urlToImage: String,
    publishedAt: {
        type: Date,
        default: Date.now
    },
    content: String,
    ratings: [
        {
            star: Number,
            comment: String,
            postedBy: { type: ObjectId, ref: "Guest" },
            posted: {
                type: Date,
                default: Date.now
            }
        }
    ]
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;

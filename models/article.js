const mongoose = require('mongoose');

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
    content: String
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;

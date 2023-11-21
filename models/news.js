const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const newsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true,
            maxlength: 75,
            text: true,

        },
        description: {
            type: String,
            required: true,
            maxlength: 2000,
            text: true,
        },
        mini: {
            type: String,
        },
        images: {
            type: Array,
        },
        link: {
            type: String,
            required: true,
        },
        tags: [{
            type: ObjectId,
            ref: 'Tag'
        }],

    },
    { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);

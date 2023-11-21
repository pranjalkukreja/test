const News = require("../models/news");
const slugify = require("slugify");


exports.create = async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
            const newProduct = await new News(req.body).save();
            res.json(newProduct);
        } else {
            res.status(400).json({
                err: 'No Title Found',
            });
        }

    } catch (err) {
        console.log(err);
        // res.status(400).send("Create product failed");
        res.status(400).json({
            err: err.message,
        });
    }
};

exports.list = async (req, res) =>
    res.json(await News.find({}).sort({ createdAt: -1 }).exec());


exports.saveNews = async (req, res) => {
    try {
        const tagsArray = req.body; // Assuming the array of tags is sent in the request body        

        for (const tag of tagsArray) {
            // Check if tag already exists to avoid duplicates
            const existingTag = await News.findOne({ title: tag.title }).exec();
            if (!existingTag) {
                const newTag = new News(tag);
                await newTag.save();
            }
        }

        return res.status(200).json({
            message: "All news have been saved successfully"
        });
    } catch (error) {
        console.error("Error saving tags:", error);
        return res.status(500).json({
            message: "Error saving tags",
            error: error
        });
    }
};
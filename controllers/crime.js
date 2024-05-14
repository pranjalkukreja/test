const axios = require('axios');
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
const Image = require('../models/image');
const { spawn } = require('child_process');
const Video = require('../models/video');
const { Configuration, OpenAIApi } = require("openai");
const Article = require('../models/article');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Define an exported function that can be used as an Express route handler
exports.scrapeCrimeData = async (req, res) => {
  try {

  } catch (error) {
    console.error('Error during scraping:', error);
    res.status(500).json({ success: false, error: 'Failed to scrape data' });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    const { file } = req; // The uploaded file is available under req.file
    if (!file) return res.status(400).send('No file uploaded');

    // Determine file type and set the appropriate extension
    const fileType = file.mimetype.split('/')[1]; // 'jpeg', 'png', 'gif', 'pdf', etc.
    const validImageTypes = ['jpeg', 'jpg', 'png', 'gif'];
    const extension = validImageTypes.includes(fileType) ? fileType : 'pdf';

    const fileName = `${Date.now()}.${extension}`; // Use 'extension' instead of hardcoding 'jpg'
    const uploadsDir = path.join(__dirname, '../public/uploads');
    const filePath = path.join(uploadsDir, fileName);

    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Move the file
    fs.renameSync(file.path, filePath);

    const publicFileUrl = `https://inlooop.com/uploads/${fileName}`;
    // For production, you might switch the URL to something like:
    // const publicFileUrl = `https://yourdomain.com/uploads/${fileName}`;

    // Save the file information in MongoDB (if necessary)
    const savedFile = await Image.create({
      public_id: fileName,
      url: publicFileUrl,
    });

    // Respond with the public URL of the uploaded file
    res.json({
      public_id: savedFile.public_id,
      url: savedFile.url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


exports.remove = async (req, res) => {
  let image_id = req.body.public_id;

  try {
    // cloudinary.uploader.destroy(image_id, (err, result) => {
    //   if (err) return res.json({ success: false, err });
    //   res.send("ok");
    // });
    // Find the image in the database
    const image = await Image.findOneAndDelete({ public_id: image_id });

    if (image) {
      // Construct the path to the image file
      const filePath = path.join(__dirname, '../public/uploads', image_id);
      // Delete the image file from the filesystem
      fs.unlink(filePath, (err) => {
        if (err) {
          // If there's an error, it could be that the file doesn't exist or is inaccessible
          console.error(err);
          return res.status(500).json({ success: false, message: "Failed to delete image from filesystem." });
        }
        // If the file was deleted successfully, send a confirmation response
        res.json({ success: true, message: "Image deleted successfully." });
      });
    } else {
      // If the image was not found in the database, send a not found response
      // res.status(404).json({ success: false, message: "Image not found." });
      res.send("ok");

    }
  } catch (err) {
    // If there's an error with the database operation, log it and send a server error response
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


exports.getImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 50; // Items per page
    const skip = (page - 1) * limit;

    // Use Promise.all to perform these operations in parallel
    const [images, totalImages] = await Promise.all([
      Image.find() // Fetch images according to the pagination
        .sort({ createdAt: -1 }) // Sort images by most recently created
        .skip(skip)
        .limit(limit),
      Image.countDocuments() // Get the total number of images
    ]);

    // Respond with image data and total count for pagination
    res.json({
      images,
      totalImages, // Total number of images, needed for pagination control on frontend
      currentPage: page,
      totalPages: Math.ceil(totalImages / limit), // Total number of pages
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.createVideo = async (req, res) => {
  try {
    // Hardcoded data for image URLs and captions
    const recentArticle = await Article.findOne().sort({ publishedAt: -1 });

    if (!recentArticle) {
      return res.status(404).json({ error: 'No recent articles found' });
    }

    // Generate captions using OpenAI
    const subjectsResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Based on these three information, ${recentArticle.title}, ${recentArticle.description}, ${recentArticle.content}, give me 3 different captions that i will be using in a tiktok video. Just give me the caption1, caption2, caption 3. dont write and give anything else just the captions. Make sure to use , ie commas to separate them and also dont wrrite 1,2 3 or caption, just give me the info that i need` },
      ],
    });
    console.log(recentArticle, subjectsResponse.data.choices[0].message.content);
    // Use the first caption as a tag for NewsAPI
    const tags = subjectsResponse.data.choices[0].message.content.trim().split(',');
    const captions = [...tags ]; // Use tags or create specific captions if needed

    const subjectsResponse1 = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: `Based on this information, ${recentArticle.title}, give me 1 subject of the statement. Just give me the subject. Nothing else, dont write and give anything else just the suject 1 word only. Give me the word that is being talked about in the sentence` },
      ],
    });
    console.log(subjectsResponse1.data.choices[0].message.content);
    // // Fetch additional images using NewsAPI
    const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: `${subjectsResponse1.data.choices[0].message.content} `,
        pageSize: captions.length - 1, // Adjust the page size if necessary
        searchIn: 'title,description',
        language: 'en',
        apiKey: '5eb6c1d605ff4d1aaef0a0753bc437c0' // Replace with your actual API key
      }
    });

    // Assuming you have images and their URLs in the newsResponse
    const additionalImages = newsResponse.data.articles.map(article => article.urlToImage).filter(url => url);

    // Combine all image URLs
    const imageUrls = [recentArticle.urlToImage, ...additionalImages];

    // Captions

    console.log(imageUrls, captions);
    // Prepare data to be passed to the Python script
    const inputJson = JSON.stringify({
      image_urls: imageUrls,
      captions: captions
    });

    // Define the path to the Python script
    const scriptPath = path.join(__dirname, '..', 'scripts', 'videos.py');

    // Spawn a new Python process
    const pythonProcess = spawn('python', [scriptPath, inputJson]);

    let dataToSend = '';
    pythonProcess.stdout.on('data', (data) => {
      dataToSend += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`Python script exited with code ${code}`);
        return res.status(500).json({ err: 'Failed to generate video' });
      }
      // Send back the result once the Python script has finished executing
      const uploadsDir = path.join(__dirname, '../public/uploads');
      const videoFileName = "output_video_with_captions.mp4"; // Or dynamically retrieve the filename from the Python script's output

      // Construct the public file URL
      const publicFileUrl = `http://localhost:8000/uploads/${videoFileName}`;

      const newVideo = Video.create({
        title: `${recentArticle.title}`, // You might want to make this dynamic based on input
        description: `${recentArticle.description}`, // Same here for dynamic input
        url: publicFileUrl
      });

      // Respond with the MongoDB document of the saved video
      res.json(newVideo);
    });
  } catch (err) {
    console.error('Error while creating video:', err);
    res.status(500).json({
      err: err.message,
    });
  }
};
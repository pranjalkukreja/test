const User = require("../models/user");
const Article = require('../models/article');
const Guest = require('../models/guest');
const mongoose = require("mongoose");
const { Expo } = require('expo-server-sdk');
const axios = require('axios');
const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
let expo = new Expo();
const { Configuration, OpenAIApi } = require("openai");
const { TwitterApi } = require('twitter-api-v2');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.sendInstaMsg = async (req, res) => {
  const IG_BUSINESS_ACCOUNT_ID = '17841461851346646';  // Replace with your Instagram business account ID
  const ACCESS_TOKEN = 'EAADLqeAjhXEBO1NcD5AiqQeEJcypobHVZC3khlI4nu4uX5Xcr3FK9yPe2UcCLGWpTPZBNV0EBzMecBQjpHGUZBZBHTHruuEuPZAn5AZCdIX6qQqlAzjZBas0rxbsWY2N24nDYgrjZAuHza6wFz7sveTdwDvXFjZA235tXsOs3ZCxyZBuo8BXYSoO34NmU8Tr1DW8IHNbZAonJrUj';  // Replace with your Instagram access token

  try {
    // Your logic to create or update user based on req.body or other data
    
    // Example of sending a greeting message in response to a DM
    const message = 'hi'; // Assuming message content is in req.body.message
    const recipientId = 'aWdfZAG06MTpJR01lc3NhZA2VUaHJlYWQ6MTc4NDE0NjE4NTEzNDY2NDY6MzQwMjgyMzY2ODQxNzEwMzAxMjQ0Mjc2MTk2MjM3MTkxNTQ5NjA0'; // Assuming recipient's Instagram user ID
    
    // Check if the message is "hi"
    if (message.toLowerCase() === 'hi') {
      // Replace with your Instagram API call to send a response message
      const response = await axios.post(
        `https://graph.facebook.com/v20.0/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message }
        },
        {
          params: { access_token: PAGE_ACCESS_TOKEN }
        }
      );

      console.log('Message sent successfully:', response.data);
      res.status(200).json({ message: 'Greeting sent successfully' });
    } else {
      res.status(200).json({ message: 'Message received' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

const PAGE_ACCESS_TOKEN = 'EAADLqeAjhXEBOZCfGGf6fWMZC9wNSOxPazXlhK8rp6A0Fy3ZAnIMlJhZCFtzFZANrJYTvr4ONEZCInbFeyrC92eK4A7r5Rq5LyYbZAgJLZBddix8dsPYFoECIZBmvZAJMyBwJfgMVrFhRVcMa9nh2pQWmzyxLwSgZAtRnZCjdAeNAPBaMZABhRLwnJZApRPuC9qBuPqMONEuEgGdt84ACTW9VE';  // Replace with your Instagram access token
const IG_BUSINESS_ACCOUNT_ID = '309469428916643';  // Replace with your Instagram business account ID

exports.getInstaMsg = async (req, res) => {
    try {
      const conversations = await fetchInstagramConversations(PAGE_ACCESS_TOKEN);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  };
  
  // Function to fetch conversations from Instagram using Graph API
  async function fetchInstagramConversations(pageAccessToken) {
    try {
      const response = await axios.get(`https://graph.facebook.com/v16.0/${IG_BUSINESS_ACCOUNT_ID}/conversations?platform=instagram&access_token=${pageAccessToken}`);
      return response.data.data;  // Return only the data array from the response
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw new Error('Failed to fetch conversations');
    }
  }

  exports.metaWebhook = async (req, res) => {
    const VERIFY_TOKEN = 'mySecureToken1234';
  
    // Parse the query parameters
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
  
    // Check if the mode and token are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }

  const NEWS_API_KEY = '2778ebc590834985b798a228345e9a83'; // Replace with your News API key
  
  exports.metaMessage = async (req, res) => {
    console.log('Received message:', JSON.stringify(req.body, null, 2));
  
    if (req.body.object === 'instagram') {
      req.body.entry.forEach(entry => {
        entry.messaging.forEach(async event => {
          console.log('Messaging Event:', JSON.stringify(event, null, 2));
          if (event.message && event.sender) {
            const senderId = event.sender.id;
            const userName = await getUserName(senderId);
  
            // Send introduction message with user's name
            await sendIntroductionMessage(senderId, userName);
  
            const messageText = event.message.text;
  
            // Handle different quick reply options
            if (messageText.toLowerCase() === 'website') {
              await sendWebsiteLink(senderId);
            } else if (messageText.toLowerCase() === 'check news') {
              await askKeywordForNews(senderId);
            } else {
              // Assume the message is a keyword if it doesn't match known commands
              await handleKeywordMessage(senderId, messageText);
            }
          }
        });
      });
    }
  
    res.status(200).send('EVENT_RECEIVED');
  }
  
  async function getUserName(senderId) {
    const pageAccessToken = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD'; // Replace with your actual access token
    const url = `https://graph.facebook.com/v16.0/${senderId}?fields=first_name,last_name&access_token=${pageAccessToken}`;
  
    try {
      const response = await axios.get(url);
      const firstName = response.data.first_name;
      const lastName = response.data.last_name;
      return `${firstName} ${lastName}`;
    } catch (error) {
      console.error('Error fetching user info:', error.response.data);
      return 'there';
    }
  }
  
  async function sendIntroductionMessage(senderId, userName) {
    const pageAccessToken = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD'; // Replace with your actual access token
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${pageAccessToken}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: `Hey ${userName}, this is Loop, an interactive news AI chatbot. We're here to change how you get news by combining and comparing Mainstream Legacy Media in real-time through our AI models, ensuring you get the most accurate news about any topic. How can we help you today?`,
        quick_replies: [
          {
            content_type: "text",
            title: "Website",
            payload: "WEBSITE"
          },
          {
            content_type: "text",
            title: "Check News",
            payload: "CHECK_NEWS"
          }
        ]
      }
    };
  
    try {
      const response = await axios.post(url, messageData);
      console.log('Introduction message sent:', response.data);
    } catch (error) {
      console.error('Error sending introduction message:', error.response.data);
    }
  }
  
  async function sendWebsiteLink(senderId) {
    const pageAccessToken = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD'; // Replace with your actual access token
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${pageAccessToken}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: "Here's our website: https://inlooop.com"
      }
    };
  
    try {
      const response = await axios.post(url, messageData);
      console.log('Website link sent:', response.data);
    } catch (error) {
      console.error('Error sending website link:', error.response.data);
    }
  }
  
  async function askKeywordForNews(senderId) {
    const pageAccessToken = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD'; // Replace with your actual access token
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${pageAccessToken}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: "Please enter a keyword to search for news:"
      }
    };
  
    try {
      const response = await axios.post(url, messageData);
      console.log('Prompt for keyword sent:', response.data);
    } catch (error) {
      console.error('Error sending prompt for keyword:', error.response.data);
    }
  }
  
  async function handleKeywordMessage(senderId, keyword) {
    const articles = await fetchNewsByKeyword(keyword);
  
    if (articles.length === 0) {
      await sendTextMessage(senderId, "Sorry, I couldn't find any news articles for that keyword.");
    } else {
      await sendNewsArticles(senderId, articles);
    }
  }
  
  async function fetchNewsByKeyword(keyword) {
    const url = `https://newsapi.org/v2/everything?q=${keyword}&apiKey=${NEWS_API_KEY}&pageSize=5`;
  
    try {
      const response = await axios.get(url);
      return response.data.articles;
    } catch (error) {
      console.error('Error fetching news:', error);
      return [];
    }
  }
  
  async function sendNewsArticles(senderId, articles) {
    const pageAccessToken = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD'; // Replace with your actual access token
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${pageAccessToken}`;
  
    let messageText = "Here are the latest news articles:\n\n";
  
    articles.forEach((article, index) => {
      messageText += `${index + 1}. ${article.title}\n${article.url}\n\n`;
    });
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: messageText
      }
    };
  
    try {
      const response = await axios.post(url, messageData);
      console.log('News articles sent:', response.data);
    } catch (error) {
      console.error('Error sending news articles:', error.response.data);
    }
  }
  
  async function sendTextMessage(senderId, messageText) {
    const pageAccessToken = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD'; // Replace with your actual access token
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${pageAccessToken}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: messageText
      }
    };
  
    try {
      const response = await axios.post(url, messageData);
      console.log('Text message sent:', response.data);
    } catch (error) {
      console.error('Error sending text message:', error.response.data);
    }
  }
  
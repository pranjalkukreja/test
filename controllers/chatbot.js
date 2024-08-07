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
const { getAnswerForQuestion } = require('./auth'); // Adjust the path as necessary

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

// const PAGE_ACCESS_TOKEN = 'EAADLqeAjhXEBOZCfGGf6fWMZC9wNSOxPazXlhK8rp6A0Fy3ZAnIMlJhZCFtzFZANrJYTvr4ONEZCInbFeyrC92eK4A7r5Rq5LyYbZAgJLZBddix8dsPYFoECIZBmvZAJMyBwJfgMVrFhRVcMa9nh2pQWmzyxLwSgZAtRnZCjdAeNAPBaMZABhRLwnJZApRPuC9qBuPqMONEuEgGdt84ACTW9VE';  // Replace with your Instagram access token
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
  const PAGE_ACCESS_TOKEN = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD'; // Replace with your actual access token
  
  // This will store conversation states in memory. For production, use a database.
  const conversations = {};
  
  exports.metaMessage = async (req, res) => {
    console.log('Received message:', JSON.stringify(req.body, null, 2));
  
    if (req.body.object === 'instagram') {
      req.body.entry.forEach(entry => {
        entry.messaging.forEach(async event => {
          console.log('Messaging Event:', JSON.stringify(event, null, 2));
          if (event.message && event.sender) {
            const senderId = event.sender.id;
            const userName = await getUserName(senderId);
  
            if (event.message.text) {
              const messageText = event.message.text.toLowerCase();
  
              if (!event.message.is_echo) {
                // Check if this is the first message in the conversation
                const conversationData = checkConversation(senderId);
                if (!conversationData) {
                  await sendIntroductionMessage(senderId, userName);
                  markConversation(senderId); // Mark the conversation to prevent repeat intros
                }
  
                // Handle specific commands
                if (messageText === 'website') {
                  await sendWebsiteLink(senderId);
                } else if (messageText === 'check news') {
                  await askKeywordForNews(senderId);
                } else if (messageText === 'fact check by loop') {
                  await askQuestionForFactCheck(senderId);
                } else if (conversationData === 'awaiting_keyword') {
                  // If the user was prompted for a keyword, handle it
                  await handleKeywordMessage(senderId, messageText);
                } else if (conversationData === 'awaiting_question') {
                  // If the user was prompted for a fact-check question, handle it
                  await handleFactCheckQuestion(senderId, messageText);
                } else {
                  // Respond to general messages without triggering a search
                  await sendDefaultResponse(senderId);
                }
              }
            }
          }
        });
      });
    }
  
    res.status(200).send('EVENT_RECEIVED');
  }
  
  async function getUserName(senderId) {
    const url = `https://graph.facebook.com/v16.0/${senderId}?fields=first_name,last_name&access_token=${PAGE_ACCESS_TOKEN}`;
  
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
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: `Hey ${userName}, this is Loop, an interactive news AI chatbot. We're here to change how you get news by combining and comparing Mainstream Legacy Media in real-time through our AI models, ensuring you get the most accurate news about any topic. How can we help you today?`,
        // quick_replies: [
        //   {
        //     content_type: "text",
        //     title: "Website",
        //     payload: "WEBSITE"
        //   },
        //   {
        //     content_type: "text",
        //     title: "Check News",
        //     payload: "CHECK_NEWS"
        //   },
        //   {
        //     content_type: "text",
        //     title: "Fact Check By Loop",
        //     payload: "FACT_CHECK"
        //   }
        // ]
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
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: "Here's our website: https://inlooop.com",
        quick_replies: [
          {
            content_type: "text",
            title: "Check News",
            payload: "CHECK_NEWS"
          },
          {
            content_type: "text",
            title: "Fact Check By Loop",
            payload: "FACT_CHECK"
          }
        ]
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
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
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
      updateConversation(senderId, 'awaiting_keyword'); // Update conversation state
    } catch (error) {
      console.error('Error sending prompt for keyword:', error.response.data);
    }
  }
  
  async function askQuestionForFactCheck(senderId) {
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: "Please enter a question for fact-checking:"
      }
    };
  
    try {
      const response = await axios.post(url, messageData);
      console.log('Prompt for fact-check question sent:', response.data);
      updateConversation(senderId, 'awaiting_question'); // Update conversation state
    } catch (error) {
      console.error('Error sending prompt for fact-check question:', error.response.data);
    }
  }
  
  async function handleKeywordMessage(senderId, keyword) {
    const articles = await fetchNewsByKeyword(keyword);
  
    if (articles.length === 0) {
      await sendTextMessage(senderId, "Sorry, I couldn't find any news articles for that keyword.");
    } else {
      await sendNewsArticles(senderId, articles);
    }
  
    updateConversation(senderId, null); // Reset conversation state
  }
  
  async function handleFactCheckQuestion(senderId, question) {
    try {
      const req = { body: { question } };
      const res = {
        json: async (data) => {
          await sendTextMessage(senderId, `Here is the fact-check result: ${data.answer}`);
          await sendTextMessage(senderId, "I hope you are satisfied with the answer. Please let me know if you need more help.");
        },
        status: (statusCode) => {
          return {
            json: (data) => console.error(`Error: ${statusCode}`, data)
          };
        }
      };
      await getAnswerForQuestion(req, res);
    } catch (error) {
      console.error('Error handling fact check question:', error);
      await sendTextMessage(senderId, "Sorry, an error occurred while processing your request. Please try again.");
    }
  
    updateConversation(senderId, null); // Reset conversation state
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
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
    const elements = articles.map(article => ({
      title: article.title,
      subtitle: article.description || 'No description available',
      image_url: article.urlToImage,
      buttons: [
        {
          type: "web_url",
          url: article.url,
          title: "Read More"
        }
      ]
    }));
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: elements
          }
        },
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
          },
          {
            content_type: "text",
            title: "Fact Check By Loop",
            payload: "FACT_CHECK"
          }
        ]
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
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: messageText,
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
          },
          {
            content_type: "text",
            title: "Fact Check By Loop",
            payload: "FACT_CHECK"
          }
        ]
      }
    };
  
    try {
      const response = await axios.post(url, messageData);
      console.log('Text message sent:', response.data);
    } catch (error) {
      console.error('Error sending text message:', error.response.data);
    }
  }
  
  async function sendDefaultResponse(senderId) {
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  
    const messageData = {
      recipient: {
        id: senderId
      },
      message: {
        text: "How can I assist you today? You can type 'Website' to visit our website, 'Check News' to search for news, or 'Fact Check By Loop' for a fact check.",
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
          },
          {
            content_type: "text",
            title: "Fact Check By Loop",
            payload: "FACT_CHECK"
          }
        ]
      }
    };
  
    try {
      const response = await axios.post(url, messageData);
      console.log('Default response sent:', response.data);
    } catch (error) {
      console.error('Error sending default response:', error.response.data);
    }
  }
  
  // Utility functions to handle conversation state
  function checkConversation(senderId) {
    // Check if the conversation has already started
    return conversations[senderId];
  }
  
  function markConversation(senderId) {
    // Mark the conversation as started
    conversations[senderId] = 'started';
  }
  
  function updateConversation(senderId, state) {
    // Update the conversation state
    conversations[senderId] = state;
  }
  
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


exports.metaMessage = async (req, res) => {
  console.log('Received message:', JSON.stringify(req.body, null, 2));
  
  if (req.body.object === 'page') {
    req.body.entry.forEach(entry => {
      entry.messaging.forEach(async event => {
        console.log('Messaging Event:', JSON.stringify(event, null, 2));
        if (event.message && event.sender) {
          await sendMessageToFacebook(event.sender.id, "Thanks for your message!");
        }
      });
    });
  }
  
  if (req.body.object === 'instagram') {
    req.body.entry.forEach(entry => {
      entry.messaging.forEach(async event => {
        console.log('Messaging Event:', JSON.stringify(event, null, 2));
        if (event.message && event.sender) {
          // Call a function to respond to the message
          await sendMessageToInstagram(event.sender.id, "Thanks for your message!");
        }
      });
    });
  }
  
  res.status(200).send('EVENT_RECEIVED');
}

async function sendMessageToInstagram(senderId, messageText) {
    const pageAccessToken = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD';  // Replace with your actual page access token
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
    console.log('Message sent response:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response.data);
  }
}

async function sendMessageToFacebook(senderId, messageText) {
    const pageAccessToken = 'EAADLqeAjhXEBO5svi3p5BiVidtXAWoirlrnw5yaXwsIscCLTxwDJ3yPwAp7srY66B9CcPqFP2zgbNJKVOznwvUL1YQg909nf63xJNW73Tr3NKyP3143HK7EXcrdLLZBsZBqRWlz6NIDzdRFO5BYEXcZCbt4sMolVhf821ORW3WZCQFrM8rSCy3wwZBloKhHH9l6Ez6pZAz0nHh9snm6QZDZD';  // Replace with your actual page access token
    const url = `https://graph.facebook.com/v16.0/me/messages?access_token=${pageAccessToken}`;

  const messageData = {
    recipient: {
      id: senderId
    },
    message: {
      text: messageText,
      quick_replies: [
        {
          content_type: "text",
          title: "Browse Products",
          payload: "BROWSE_PRODUCTS"
        },
        {
          content_type: "text",
          title: "Make a Reservation",
          payload: "MAKE_RESERVATION"
        },
        {
          content_type: "text",
          title: "Get Help",
          payload: "GET_HELP"
        }
      ]
    }
  };

  try {
    const response = await axios.post(url, messageData);
    console.log('Message sent response:', response.data);
  } catch (error) {
    console.error('Error sending message:', error.response.data);
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
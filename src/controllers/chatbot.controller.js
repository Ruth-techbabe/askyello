const chatbotService = require('../services/chatbot.service');

const chatWithBot = async (req, res) => {
  console.log('===========================================');
  console.log(' CHATBOT REQUEST RECEIVED');
  console.log('===========================================');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User:', req.user ? req.user.email : 'Anonymous');
  
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      console.log('Empty message received');
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    console.log('User message:', message);
    console.log('Message length:', message.length);

    // Check OpenAI API key
    console.log('Checking OpenAI configuration...');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY starts with:', process.env.OPENAI_API_KEY?.substring(0, 7));
    console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);

    if (!process.env.OPENAI_API_KEY) {
      console.error(' FATAL: OPENAI_API_KEY not set in environment!');
      return res.status(500).json({
        success: false,
        message: 'Our assistant is temporarily unavailable. Please try again in a few minutes.',
      });
    }

    // Initialize OpenAI
    console.log('Initializing OpenAI client...');
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log(' OpenAI client initialized');

    // Search providers for context
    console.log('Searching for relevant providers...');
    const Provider = require('../models/Provider.model');
    const { Op } = require('sequelize');
    
    const providers = await Provider.findAll({
      where: {
        verificationStatus: 'verified',
      },
      attributes: ['id', 'businessName', 'category', 'description', 'address'],
      limit: 5,
    });

    console.log(` Found ${providers.length} providers for context`);

    // Build context
    const providerContext = providers.map(p => 
      `${p.businessName} - ${p.category} - ${p.description || 'No description'}`
    ).join('\n');

    console.log('Provider context built:', providerContext.substring(0, 100) + '...');

    // Create system prompt
    const systemPrompt = `You are a helpful assistant for AskYello, a service marketplace in Nigeria.
Help users find service providers like plumbers, electricians, caterers, etc.

Available providers:
${providerContext}

Instructions:
- Be friendly and helpful
- Recommend relevant providers from the list above
- If asked about services not in the list, politely inform them
- Keep responses concise (2-3 sentences)
- Don't make up providers that aren't in the list`;

    console.log('System prompt created, length:', systemPrompt.length);

    // Call OpenAI API
    console.log(' Calling OpenAI API...');
    console.log('   Model: gpt-4');
    console.log('   Max tokens: 150');
    
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const endTime = Date.now();
    console.log(`OpenAI API responded in ${endTime - startTime}ms`);
    
    console.log('Response received:', JSON.stringify(completion, null, 2));

    const botResponse = completion.choices[0]?.message?.content || 
      'I apologize, I could not generate a response. Please try again.';

    console.log('Bot response:', botResponse);
    console.log('Response length:', botResponse.length);

    console.log('===========================================');
    console.log('CHATBOT REQUEST SUCCESSFUL');
    console.log('===========================================');

    res.json({
      success: true,
      data: {
        message: botResponse,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('===========================================');
    console.error('CHATBOT ERROR');
    console.error('===========================================');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status:', error.status);
    
    if (error.response) {
      console.error('API response status:', error.response.status);
      console.error('API response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('Full error:', error);
    console.error('Stack trace:', error.stack);
    console.error('===========================================');

    // Detailed error messages
    let errorMessage = 'Our assistant is temporarily unavailable. Please try again in a few minutes.';
    let errorDetails = '';

    if (error.message?.includes('API key')) {
      errorDetails = 'Invalid API key';
      console.error(' FIX: Check OPENAI_API_KEY in Render environment variables');
    } else if (error.message?.includes('insufficient_quota')) {
      errorDetails = 'OpenAI quota exceeded';
      console.error(' FIX: Add credits to OpenAI account at platform.openai.com');
    } else if (error.message?.includes('rate_limit')) {
      errorDetails = 'Rate limit exceeded';
      console.error('FIX: Wait a few minutes and try again');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      errorDetails = 'Network connection error';
      console.error(' FIX: Check internet connection or OpenAI service status');
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
    });
  }
};

module.exports = {
  chatWithBot,
};
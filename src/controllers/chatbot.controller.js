const chatbotService = require('../services/chatbot.service');

const chatWithBot = async (req, res) => {
  try {
    const { message, location } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const intent = await chatbotService.parseUserIntent(message);

    // If asking about registration, return guide directly
    if (intent.type === 'provider_registration_guide') {
      const guide = chatbotService.getProviderRegistrationGuide();
      
      return res.json({
        success: true,
        data: {
          message: guide.guide,
          type: 'registration_guide',
          steps: guide.steps,
          requirements: guide.requirements,
          providers: [],
        },
      });
    }

    // Otherwise, search for providers
    const providers = await chatbotService.searchProviders(intent, location);
    const botResponse = await chatbotService.generateResponse(message, providers, intent);

    res.json({
      success: true,
      data: {
        message: botResponse,
        type: 'provider_search',
        providers: providers.map((p) => ({
          id: p.id,
          businessName: p.businessName,
          category: p.category,
          rating: p.averageRating,
          totalReviews: p.totalReviews,
          address: p.address,
          location: {
            latitude: p.latitude,
            longitude: p.longitude,
          },
        })),
        intent,
      },
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot service temporarily unavailable',
    });
  }
};

module.exports = { chatWithBot };
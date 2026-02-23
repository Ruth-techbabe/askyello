const OpenAI = require('openai');
const Provider = require('../models/Provider.model');
const { Op } = require('sequelize');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class ChatbotService {
  // Detect if user is asking about provider registration
  async isProviderRegistrationQuery(userMessage) {
    const registrationKeywords = [
      'create provider',
      'register business',
      'become provider',
      'add my business',
      'list my service',
      'sign up provider',
      'register vendor',
      'create vendor',
      'how to register',
      'create account',
      'provider account',
      'business account',
      'join as provider',
      'add my company',
    ];

    const lowerMessage = userMessage.toLowerCase();
    return registrationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Provide step-by-step registration guide
  getProviderRegistrationGuide() {
    return {
      guide: `
# 🎯 How to Create a Provider Profile on Ask Yello

Follow these simple steps to register your business:

## Step 1: Go to Registration Page
Visit the **Ask Yello Provider Registration** page on our website.

## Step 2: Fill in Your Business Information

You'll need to provide:

### Personal Information:
- **Your Full Name**: Your name as the business owner
- **Email Address**: A valid email (you'll receive a verification link)
- **Password**: Create a strong password (minimum 8 characters)

### Business Information:
- **Business Name**: Your company/shop name (this will be your login username)
- **Category**: Choose your service category (plumbing, electrical, cleaning, etc.)
- **Phone Number**: Your business contact number
- **WhatsApp Number**: Optional - for customer inquiries
- **Business Address**: Your physical location in Nigeria

### Optional Information:
- **Description**: Tell customers about your services
- **Services Offered**: List specific services (e.g., "Emergency repairs", "Installation")
- **Working Hours**: Your business operating hours

## Step 3: Submit Your Registration
Click the **"Register"** button to submit your information.

## Step 4: Verify Your Email ✉️
1. Check your email inbox (the one you provided)
2. You'll receive an email from Ask Yello with a **verification link**
3. Click the link in the email
4. You'll be redirected to the vendor login page

## Step 5: Login with Your Business Name 🔑
1. On the vendor login page, enter:
   - **Business Name**: The exact name you registered
   - **Password**: Your password
2. Click **"Login"**

## Step 6: Complete Your Profile
After logging in:
- Add business images/photos
- Update your service details
- Set your availability
- Wait for admin approval (usually 24-48 hours)

## Step 7: Start Receiving Customers! 🎉
Once approved, your business will be visible to customers searching for services in your area.

---

## 💡 Important Tips:
- Use a **unique business name** (no one else can use the same name)
- **Remember your business name** - you'll use it to login, not your email
- Check your **spam folder** if you don't receive the verification email
- Your account won't work until you **verify your email**
- Keep your **password safe**

## ❓ Need Help?
If you have questions or need assistance, contact our support team or use this chatbot to ask specific questions!
      `,
      steps: [
        '1. Visit Ask Yello Provider Registration page',
        '2. Fill in your personal info (name, email, password)',
        '3. Fill in business info (business name, category, phone, address)',
        '4. Submit registration',
        '5. Check your email for verification link',
        '6. Click the verification link',
        '7. Login with your Business Name and password',
        '8. Complete your profile and wait for approval',
      ],
      requirements: {
        personal: ['Full Name', 'Email Address', 'Password (8+ characters)'],
        business: ['Business Name (unique)', 'Service Category', 'Phone Number', 'Business Address'],
        optional: ['WhatsApp Number', 'Business Description', 'Services List', 'Working Hours'],
      },
    };
  }

  async parseUserIntent(userMessage) {
    // Check if asking about provider registration
    if (await this.isProviderRegistrationQuery(userMessage)) {
      return {
        type: 'provider_registration_guide',
        query: userMessage,
      };
    }

    const prompt = `Extract search intent from this user message:

"${userMessage}"

Return JSON with:
{
  "category": "<service category if mentioned>",
  "keywords": ["<relevant search terms>"],
  "filters": {
    "minRating": <number 1-5 if quality mentioned>,
    "verified": <boolean if trust/verified mentioned>
  }
}

Categories: plumbing, electrical, carpentry, painting, cleaning, catering, tailoring, salon, mechanic, other`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a search intent parser for a service marketplace.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Intent parsing error:', error);
      return { keywords: [] };
    }
  }

  async searchProviders(intent, userLocation) {
    const whereClause = {
      isActive: true,
      verificationStatus: 'verified',
    };

    if (intent.category) {
      whereClause.category = intent.category;
    }

    if (intent.filters?.minRating) {
      whereClause.averageRating = {
        [Op.gte]: intent.filters.minRating,
      };
    }

    if (intent.keywords && intent.keywords.length > 0) {
      whereClause[Op.or] = [
        { businessName: { [Op.like]: `%${intent.keywords.join('%')}%` } },
        { description: { [Op.like]: `%${intent.keywords.join('%')}%` } },
      ];
    }

    let providers = await Provider.findAll({
      where: whereClause,
      order: [
        ['averageRating', 'DESC'],
        ['totalReviews', 'DESC'],
      ],
      limit: 10,
    });

    if (userLocation?.latitude && userLocation?.longitude) {
      providers = this.sortByDistance(providers, userLocation);
    }

    return providers;
  }

  async generateResponse(userMessage, providers, intent) {
    // If asking about provider registration, return guide
    if (intent.type === 'provider_registration_guide') {
      const guide = this.getProviderRegistrationGuide();
      return guide.guide;
    }

    // Existing provider search response
    const providersContext = providers
      .map(
        (p, i) =>
          `${i + 1}. ${p.businessName} - ${p.category} (${p.averageRating}/5, ${p.totalReviews} reviews)`
      )
      .join('\n');

    const prompt = `User asked: "${userMessage}"

Found providers:
${providersContext}

Generate a helpful, conversational response. Keep it brief and friendly.`;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for Ask Yello, a Nigerian SME service marketplace. Help users find service providers or learn how to register their business.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Response generation error:', error);
      return 'I found some great providers for you!';
    }
  }

  sortByDistance(providers, userLocation) {
    const geolocationService = require('./geolocation.service');
    
    return providers
      .map((provider) => {
        // Skip providers without coordinates
        if (provider.latitude === null || provider.longitude === null) {
          return {
            provider,
            distance: null,
            hasCoordinates: false,
          };
        }

        const distance = geolocationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(provider.latitude),
          parseFloat(provider.longitude)
        );

        return {
          provider,
          distance,
          hasCoordinates: true,
        };
      })
      .sort((a, b) => {
        // Providers with coordinates come first
        if (a.hasCoordinates && !b.hasCoordinates) return -1;
        if (!a.hasCoordinates && b.hasCoordinates) return 1;
        // Then sort by distance
        if (a.hasCoordinates && b.hasCoordinates) {
          return a.distance - b.distance;
        }
        return 0;
      })
      .map((item) => item.provider);
  }
} 

module.exports = new ChatbotService();
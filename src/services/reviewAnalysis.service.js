const OpenAI = require('openai');
const Review = require('../models/Review.model');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class ReviewAnalysisService {
  async analyzeReview(reviewText, rating) {
    try {
      const prompt = `Analyze this business review for authenticity and sentiment:

Review: "${reviewText}"
Rating: ${rating}/5

Provide analysis in JSON format:
{
  "sentimentScore": <number from -1 to 1>,
  "isManipulative": <boolean>,
  "reasoning": "<brief explanation>",
  "flags": {
    "genericContent": <boolean>,
    "excessivePositivity": <boolean>,
    "suspiciousPatterns": <boolean>,
    "inappropriateContent": <boolean>
  }
}`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_REVIEW_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at detecting fake reviews and analyzing sentiment.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      let weight = 1.0;

      if (analysis.flags.genericContent) weight *= 0.6;
      if (analysis.flags.suspiciousPatterns) weight *= 0.5;

      if (reviewText.length > 100 && Math.abs(analysis.sentimentScore) < 0.5) {
        weight *= parseFloat(process.env.REVIEW_WEIGHT_NEUTRAL || '1.2');
      }

      if (reviewText.length > 150) {
        weight *= parseFloat(process.env.REVIEW_WEIGHT_DETAILED || '1.5');
      }

      return {
        sentimentScore: analysis.sentimentScore,
        isManipulative: analysis.isManipulative,
        flags: analysis.flags,
        suggestedWeight: Math.max(0.1, Math.min(2.0, weight)),
      };
    } catch (error) {
      console.error('Review analysis error:', error);
      return {
        sentimentScore: 0,
        isManipulative: false,
        flags: {},
        suggestedWeight: 1.0,
      };
    }
  }

  calculateWeightedRating(reviews) {
    const approvedReviews = reviews.filter((r) => r.status === 'approved');

    if (approvedReviews.length === 0) return 0;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const review of approvedReviews) {
      totalWeightedScore += review.rating * review.weight;
      totalWeight += review.weight;
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }
}

module.exports = new ReviewAnalysisService();
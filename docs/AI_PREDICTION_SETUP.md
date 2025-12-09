# 🤖 AI Milk Prediction Setup Guide

## Overview

MTK Dairy uses **Groq AI** to provide intelligent milk production predictions based on historical data, animal health records, and environmental factors.

## 🚀 Quick Setup (5 minutes)

### 1. Get Your Groq API Key

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up or login with Google/GitHub (free account)
3. Navigate to **API Keys** in the left sidebar
4. Click **"Create API Key"**
5. Give it a name (e.g., "MTK Dairy Production")
6. Copy the generated key

### 2. Add API Key to Environment

Open `.env.local` and replace:

```env
GROQ_API_KEY=your_groq_api_key_here
```

With your actual key:

```env
GROQ_API_KEY=gsk_abc123def456ghi789...
```

### 3. Restart Your Development Server

```bash
npm run dev
```

That's it! AI predictions are now enabled.

## 📊 How AI Predictions Work

### Data Sources Analyzed

- **Historical Milk Production**: Last 30 days of milk logs
- **Animal Information**: Species, breed, age, lactation stage
- **Health Records**: Recent health issues and treatments
- **Production Trends**: Increasing, decreasing, or stable patterns

### Prediction Output

```json
{
  "predictedYield": 15.2, // Tomorrow's expected yield (liters)
  "confidence": 85, // Confidence score (0-100%)
  "trend": "increasing", // Production trend
  "factors": {
    "health": "Good health status",
    "nutrition": "Optimal feed intake",
    "environmental": "Normal temperature"
  },
  "recommendations": ["Maintain current feeding schedule", "Monitor for any health changes"],
  "insights": ["Production has increased 12% over last week", "Cow is in peak lactation period"]
}
```

## 🎯 Using AI Predictions

### Single Animal Prediction

```javascript
// Available at: /api/ai/milk-prediction
POST /api/ai/milk-prediction
{
  "animalId": "animal-123",
  "daysOfData": 30,
  "includeFactors": true
}
```

### Batch Prediction (Up to 10 Animals)

```javascript
POST /api/ai/milk-prediction
{
  "animalIds": ["animal-1", "animal-2", "animal-3"],
  "daysOfData": 30,
  "includeFactors": true
}
```

### Integration in Components

```typescript
import { getMilkPrediction } from '@/lib/ai/prediction';

// Get prediction for an animal
const prediction = await getMilkPrediction({
  animalId: 'animal-123',
  daysOfData: 30,
  includeFactors: true,
});
```

## 📈 Features Enabled

### ✅ Already Implemented

- **Individual Animal Predictions**: AI analysis for each animal
- **Batch Predictions**: Process multiple animals at once
- **Trend Analysis**: Identify production patterns
- **Factor Analysis**: Health, nutrition, environmental insights
- **Actionable Recommendations**: Specific suggestions for improvement
- **Confidence Scoring**: Reliability indicator for predictions
- **Offline Support**: Works with offline-first architecture

### 🔄 How It Updates

- **Real-time**: New predictions generated on demand
- **Historical**: Uses last 30 days of data for accuracy
- **Learning**: Improves with more data over time
- **Automatic**: No manual training required

## 🛠️ Technical Details

### AI Model

- **Provider**: Groq (Ultra-fast inference)
- **Model**: Llama 3.1 70B Versatile
- **Speed**: ~100 tokens per second
- **Cost**: Free tier (7,000 requests/day)

### API Rate Limits

- **Free Tier**: 7,000 requests/day (~233/hour)
- **Pro Tier**: 30,000 requests/day (~1,250/hour)
- **Enterprise**: Unlimited

### Data Privacy

- All data processed securely
- No animal data stored with Groq
- GDPR compliant processing
- Data used only for predictions

## 🔧 Troubleshooting

### Common Issues

#### 1. "API Key Invalid" Error

**Solution**: Double-check your API key in `.env.local` and restart the server.

#### 2. "No Data Available" Error

**Solution**: Ensure the animal has milk logs from the last 30 days.

#### 3. Slow Response Times

**Solution**: Groq is optimized for speed. If slow, check your internet connection.

#### 4. Prediction Accuracy Low

**Solution**: More historical data improves accuracy. Ensure consistent milk logging.

### Error Messages

- `401 Unauthorized`: Check API key
- `404 Not Found`: Animal ID doesn't exist
- `429 Too Many Requests`: Rate limit exceeded
- `500 Server Error`: Temporary Groq issue, try again

## 📱 Mobile Usage

AI predictions work seamlessly on mobile devices:

- **Offline**: Cached predictions available
- **Online**: Real-time predictions
- **Background**: Automatic sync when connected

## 🔮 Future Enhancements

### Planned Features

- **Weather Integration**: Include weather data in predictions
- **Feed Analysis**: Correlate feed types with production
- **Breed-Specific Models**: Tailored predictions per breed
- **Seasonal Adjustments**: Account for seasonal variations
- **Alert System**: Notify about unusual production changes

### Custom Models

For enterprise customers, we can train custom models on your farm's specific data for even higher accuracy.

## 💡 Best Practices

### For Accurate Predictions

1. **Consistent Logging**: Log milk data daily
2. **Complete Records**: Include health and breeding data
3. **Regular Updates**: Keep animal information current
4. **Monitor Trends**: Review prediction insights regularly

### For Cost Efficiency

1. **Batch Requests**: Use batch predictions for multiple animals
2. **Cache Results**: Store predictions for 24 hours
3. **Smart Timing**: Predict during off-peak hours
4. **Monitor Usage**: Track API usage in dashboard

## 📞 Support

### Get Help

- **Documentation**: Check this guide first
- **Community**: Join our Discord community
- **Email**: support@maliktechdairy.com
- **Issues**: Report bugs on GitHub

### Rate Limit Increase

Need more than 7,000 predictions/day?

1. Upgrade to Groq Pro ($20/month)
2. Or contact us for enterprise pricing

---

**🎉 You're all set!** Your dairy farm now has AI-powered milk predictions to help optimize production and animal care.

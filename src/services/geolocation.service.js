const { Op } = require('sequelize');
const axios = require('axios');

class GeolocationService {
  async geocodeAddress(address) {
    // Check if Google Maps API key exists
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn(' GOOGLE_MAPS_API_KEY not configured. Address will be stored without coordinates.');
      return {
        formattedAddress: address,  
        latitude: null,             
        longitude: null,            
        placeId: null,
        geocoded: false,
      };
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: address,
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        }
      );

      // Check API response status
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          formattedAddress: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          placeId: result.place_id,
          geocoded: true,
        };
      } else if (response.data.status === 'REQUEST_DENIED') {
        // API key issue
        console.error('Google Maps API Error:', response.data.error_message);
        console.warn('Storing address without coordinates due to API issue');
        return {
          formattedAddress: address,
          latitude: null,   
          longitude: null,  
          placeId: null,
          geocoded: false,
        };
      } else {
        // No results found for this address
        console.warn(`No geocoding results for address: "${address}". Status: ${response.data.status}`);
        return {
          formattedAddress: address,  
          latitude: null,             
          longitude: null,            
          placeId: null,
          geocoded: false,
        };
      }
    } catch (error) {
      // Network error or API failure
      console.error('Geocoding error:', error.message);
      console.warn('Storing address without coordinates due to error');
      return {
        formattedAddress: address,
        latitude: null,   
        longitude: null,  
        placeId: null,
        geocoded: false,
      };
    }
  }

  async findNearbyProviders(latitude, longitude, radiusKm = 10) {
    const Provider = require('../models/Provider.model');

    const latDegPerKm = 1 / 111;
    const lngDegPerKm = 1 / (111 * Math.cos((latitude * Math.PI) / 180));

    const minLat = latitude - radiusKm * latDegPerKm;
    const maxLat = latitude + radiusKm * latDegPerKm;
    const minLng = longitude - radiusKm * lngDegPerKm;
    const maxLng = longitude + radiusKm * lngDegPerKm;

    const providers = await Provider.findAll({
      where: {
        latitude: { 
          [Op.ne]: null,                    
          [Op.between]: [minLat, maxLat] 
        },
        longitude: { 
          [Op.ne]: null,                    
          [Op.between]: [minLng, maxLng] 
        },
        isActive: true,
        verificationStatus: 'verified',     
      },
    });

    return providers
      .map((provider) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          parseFloat(provider.latitude),
          parseFloat(provider.longitude)
        );
        return {
          ...provider.toJSON(),
          distance,
        };
      })
      .filter((p) => p.distance !== null && p.distance <= radiusKm)  
      .sort((a, b) => a.distance - b.distance);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Handle NULL coordinates
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
      return null;  // Can't calculate distance without coordinates
    }

    const R = 6371; // Radius of Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }
}

module.exports = new GeolocationService();
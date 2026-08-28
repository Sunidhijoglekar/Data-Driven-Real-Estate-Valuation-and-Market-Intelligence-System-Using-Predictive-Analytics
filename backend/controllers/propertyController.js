/**
 * Property Controller - Property listings, search, filtering, and CRUD operations
 */
import { db } from '../database/db.js';
import { computePropertyValuation } from '../utils/mlEngine.js';

export const getProperties = (req, res) => {
  try {
    let allProperties = db.getProperties();
    const { city, minPrice, maxPrice, minArea, maxArea, bhk, propertyAge, amenity, search, featured, page, limit } = req.query;

    if (featured === 'true') {
      // Homepage preview: Return top 6 featured properties
      const featuredList = allProperties.slice(0, 6).map(p => {
        const valuation = computePropertyValuation(p);
        return {
          ...p,
          predictedPrice: valuation.predictedPrice,
          matchScore: 98,
          valuation
        };
      });
      return res.json({
        total: featuredList.length,
        count: featuredList.length,
        properties: featuredList
      });
    }

    // Step 1: Filter by City if explicitly requested (and not 'All')
    let candidatePool = allProperties;
    if (city && city !== 'All') {
      const cityFiltered = candidatePool.filter(p => p.city && p.city.toLowerCase() === city.toLowerCase());
      if (cityFiltered.length > 0) {
        candidatePool = cityFiltered;
      }
    }

    // Active filter parameters
    const hasMinPrice = minPrice && !isNaN(parseFloat(minPrice)) && parseFloat(minPrice) > 0;
    const hasMaxPrice = maxPrice && !isNaN(parseFloat(maxPrice)) && parseFloat(maxPrice) > 0;
    const hasMinArea = minArea && !isNaN(parseFloat(minArea)) && parseFloat(minArea) > 0;
    const hasMaxArea = maxArea && !isNaN(parseFloat(maxArea)) && parseFloat(maxArea) > 0;
    const hasBhk = bhk && bhk !== 'All';
    const hasAge = propertyAge && propertyAge !== 'All';
    const hasAmenity = amenity && amenity !== 'All' && amenity.trim() !== '';
    const hasSearch = search && search.trim() !== '';

    const hasActiveFilters = hasMinPrice || hasMaxPrice || hasMinArea || hasMaxArea || hasBhk || hasAge || hasAmenity || hasSearch;

    // Helper: Exact Match Check
    const isExactMatch = (p) => {
      if (hasMinPrice && p.price < parseFloat(minPrice)) return false;
      if (hasMaxPrice && p.price > parseFloat(maxPrice)) return false;

      const pArea = p.area || p.area_sqft || 0;
      if (hasMinArea && pArea < parseFloat(minArea)) return false;
      if (hasMaxArea && pArea > parseFloat(maxArea)) return false;

      if (hasBhk) {
        if (bhk === '4+' || bhk === '4') {
          if (p.bhk < 4) return false;
        } else {
          const bhkNum = parseInt(bhk, 10);
          if (!isNaN(bhkNum) && p.bhk !== bhkNum) return false;
        }
      }

      if (hasAge && p.age) {
        if (!p.age.toLowerCase().includes(propertyAge.toLowerCase())) return false;
      }

      if (hasAmenity) {
        const targetAmenity = amenity.toLowerCase();
        if (!Array.isArray(p.amenities) || !p.amenities.some(a => a.toLowerCase().includes(targetAmenity))) {
          return false;
        }
      }

      if (hasSearch) {
        const q = search.trim().toLowerCase();
        const matchesQuery = 
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.locality && p.locality.toLowerCase().includes(q)) ||
          (p.projectName && p.projectName.toLowerCase().includes(q)) ||
          (p.builder && p.builder.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      return true;
    };

    let exactMatches = candidatePool.filter(isExactMatch);
    let finalProperties = [];
    let isRecommendation = false;
    let recommendationMessage = null;

    if (exactMatches.length > 0 || !hasActiveFilters) {
      // Return exact matches
      isRecommendation = false;
      finalProperties = exactMatches.map(p => {
        const valuation = computePropertyValuation(p);
        let matchScore = 95;
        if (hasMaxPrice && p.price <= parseFloat(maxPrice)) matchScore += 2;
        if (hasMinArea && (p.area || p.area_sqft || 0) >= parseFloat(minArea)) matchScore += 2;
        
        return {
          ...p,
          predictedPrice: valuation.predictedPrice,
          matchScore: Math.min(99, matchScore),
          isRecommendation: false,
          valuation
        };
      });
    } else {
      // NO exact matches found! Calculate similarity score for nearest matching properties
      isRecommendation = true;
      recommendationMessage = "Showing the closest matching properties based on your selected filters.";

      // Targets
      let targetPrice = null;
      if (hasMinPrice && hasMaxPrice) {
        targetPrice = (parseFloat(minPrice) + parseFloat(maxPrice)) / 2;
      } else if (hasMaxPrice) {
        targetPrice = parseFloat(maxPrice);
      } else if (hasMinPrice) {
        targetPrice = parseFloat(minPrice);
      }

      let targetArea = null;
      if (hasMinArea && hasMaxArea) {
        targetArea = (parseFloat(minArea) + parseFloat(maxArea)) / 2;
      } else if (hasMaxArea) {
        targetArea = parseFloat(maxArea);
      } else if (hasMinArea) {
        targetArea = parseFloat(minArea);
      }

      let targetBhk = null;
      if (hasBhk) {
        targetBhk = bhk === '4+' ? 4 : parseInt(bhk, 10);
      }

      const parseAgeYears = (ageStr) => {
        if (!ageStr) return 3;
        if (ageStr.includes('<1')) return 0.5;
        if (ageStr.includes('1-5')) return 3;
        if (ageStr.includes('5-10')) return 7.5;
        if (ageStr.includes('>10')) return 12;
        return 3;
      };
      const targetAgeYears = hasAge ? parseAgeYears(propertyAge) : null;

      // Score each candidate property
      const scoredCandidates = candidatePool.map(p => {
        let score = 100;

        // 1. Price Similarity
        if (targetPrice !== null) {
          const priceDiff = Math.abs(p.price - targetPrice);
          const relDiff = priceDiff / Math.max(targetPrice, 1);
          score -= Math.min(45, relDiff * 40);
        }

        // 2. Area Similarity
        if (targetArea !== null) {
          const propArea = p.area || p.area_sqft || 1000;
          const areaDiff = Math.abs(propArea - targetArea);
          const relDiff = areaDiff / Math.max(targetArea, 1);
          score -= Math.min(30, relDiff * 30);
        }

        // 3. BHK Similarity
        if (targetBhk !== null && !isNaN(targetBhk)) {
          const bhkDiff = Math.abs(p.bhk - targetBhk);
          score -= Math.min(25, bhkDiff * 15);
        }

        // 4. Amenity Similarity
        if (hasAmenity) {
          const targetAmenity = amenity.toLowerCase();
          const hasIt = Array.isArray(p.amenities) && p.amenities.some(a => a.toLowerCase().includes(targetAmenity));
          if (hasIt) {
            score += 10;
          } else {
            const numAmenities = Array.isArray(p.amenities) ? p.amenities.length : 0;
            score -= Math.max(5, 15 - numAmenities);
          }
        }

        // 5. Property Age Similarity
        if (targetAgeYears !== null) {
          const propAgeYears = parseAgeYears(p.age);
          const ageDiff = Math.abs(propAgeYears - targetAgeYears);
          score -= Math.min(15, ageDiff * 1.5);
        }

        // 6. Search similarity
        if (hasSearch) {
          const q = search.trim().toLowerCase();
          const locMatch = p.locality && p.locality.toLowerCase().includes(q);
          const nameMatch = p.name && p.name.toLowerCase().includes(q);
          if (locMatch || nameMatch) {
            score += 15;
          } else {
            score -= 10;
          }
        }

        const valuation = computePropertyValuation(p);
        const matchScore = Math.max(68, Math.min(94, Math.round(score)));

        return {
          ...p,
          predictedPrice: valuation.predictedPrice,
          matchScore,
          isRecommendation: true,
          valuation
        };
      });

      // Sort by match score descending
      scoredCandidates.sort((a, b) => b.matchScore - a.matchScore);
      finalProperties = scoredCandidates;
    }

    const totalFiltered = finalProperties.length;

    // Pagination
    let paginatedProperties = finalProperties;
    let pageNum = parseInt(page, 10);
    let limitNum = parseInt(limit, 10);

    if (!isNaN(pageNum) && pageNum > 0 && !isNaN(limitNum) && limitNum > 0) {
      const startIndex = (pageNum - 1) * limitNum;
      paginatedProperties = finalProperties.slice(startIndex, startIndex + limitNum);
    }

    res.json({
      total: totalFiltered,
      count: paginatedProperties.length,
      page: !isNaN(pageNum) ? pageNum : 1,
      limit: !isNaN(limitNum) ? limitNum : totalFiltered,
      totalPages: !isNaN(limitNum) && limitNum > 0 ? Math.ceil(totalFiltered / limitNum) : 1,
      isRecommendation,
      recommendationMessage: isRecommendation ? (recommendationMessage || "Showing the closest matching properties based on your selected filters.") : null,
      properties: paginatedProperties
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPropertyById = (req, res) => {
  try {
    const { id } = req.params;
    const property = db.getPropertyById(id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const valuation = computePropertyValuation(property);

    res.json({
      ...property,
      valuation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProperty = (req, res) => {
  try {
    const {
      name, city, locality, price, area, bhk, bathrooms, age,
      amenities, description, auctionEnabled, startingPrice, minIncrement,
      image
    } = req.body;

    if (!name || !city || !price || !area) {
      return res.status(400).json({ error: "Name, City, Price, and Area are required" });
    }

    const defaultImages = [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
    ];

    const newProp = {
      id: `prop-${Date.now()}`,
      name,
      city,
      locality: locality || city,
      price: parseFloat(price),
      area: parseFloat(area),
      bhk: parseInt(bhk) || 2,
      bathrooms: parseInt(bathrooms) || 2,
      age: age || "1-5 yrs",
      ageYears: age === '<1 yr' ? 0.5 : age === '1-5 yrs' ? 3 : age === '5-10 yrs' ? 7 : 12,
      amenities: Array.isArray(amenities) ? amenities : ["Security", "Parking"],
      image: image || defaultImages[Math.floor(Math.random() * defaultImages.length)],
      lat: 12.9716,
      lng: 77.5946,
      seller: req.body.seller || "Current Seller",
      sellerEmail: req.body.sellerEmail || "seller@apexrealty.com",
      description: description || "Modern residential property with excellent transport connectivity.",
      auctionEnabled: Boolean(auctionEnabled),
      startingPrice: parseFloat(startingPrice) || parseFloat(price),
      minIncrement: parseFloat(minIncrement) || 1,
      auctionEnd: auctionEnabled ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      bids: []
    };

    const saved = db.addProperty(newProp);
    res.status(201).json({ message: "Property added successfully", property: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProperty = (req, res) => {
  try {
    const { id } = req.params;
    const updated = db.updateProperty(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json({ message: "Property updated successfully", property: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProperty = (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteProperty(id);
    if (!deleted) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json({ message: "Property deleted successfully", id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

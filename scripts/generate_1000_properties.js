import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROPERTIES_FILE = path.join(__dirname, '../ml/datasets/current_properties.json');

const cities = [
  { 
    name: 'Bangalore', 
    lat: 12.9716, 
    lng: 77.5946, 
    localities: [
      'Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Electronic City',
      'Hebbal', 'Yelahanka', 'Sarjapur Road', 'Bellandur', 'Thanisandra',
      'Marathahalli', 'Jayanagar', 'Rajajinagar', 'Banashankari', 'Malleshwaram',
      'Kaggadasapura', 'BTM Layout', 'JP Nagar', 'C V Raman Nagar', 'Varthur'
    ] 
  }
];

const builders = [
  'Prestige Group', 'DLF Limited', 'Godrej Properties', 'Sobha Limited',
  'Oberoi Realty', 'Hiranandani Group', 'Lodha Group', 'Aparna Constructions',
  'Brigade Group', 'Puravankara', 'Rustomjee', 'Tata Housing', 'Mahindra Lifespaces',
  'Casagrand', 'Kolte-Patil', 'Piramal Realty'
];

const propertyTypes = [
  '1 BHK Flat', '2 BHK Flat', '3 BHK Flat', '4 BHK Flat', '5 BHK Villa',
  'Independent Villa', 'Penthouse', 'Commercial Office'
];

const areaTypes = ['Super Built-up Area', 'Carpet Area', 'Built-up Area', 'Plot Area'];
const ages = ['<1 yr', '1-5 yrs', '5-10 yrs', '>10 yrs'];
const constructionStatuses = ['Ready To Move', 'Under Construction'];
const sellers = ['Owner', 'Apex Realty Partner', 'Primary Developer', 'Individual Consultant'];
const sellerEmails = ['seller@apexrealty.com', 'seller2@apexrealty.com', 'seller3@apexrealty.com', 'seller4@apexrealty.com'];

const allAmenities = [
  "Swimming Pool", "Gymnasium", "Security", "Parking", "Elevator",
  "Clubhouse", "Power Backup", "Garden", "Tennis Court", "Jogging Track"
];

const images = [
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
];

const prefixes = [
  'Royal', 'Grand', 'Emerald', 'Serene', 'Skyline', 'Imperia', 'Elegance', 'Urban', 'Central',
  'Valley', 'Heights', 'Palms', 'Vista', 'Avenue', 'Oasis', 'Solitaire', 'Signature', 'Crown'
];
const suffixes = [
  'Residences', 'Towers', 'Enclave', 'Greens', 'Park', 'Square', 'Estate', 'Court', 'Plaza',
  'Heights', 'Gardens', 'Terraces', 'Villas', 'Haven'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const properties = [];
const TOTAL_PROPERTIES = 1080;

for (let i = 1; i <= TOTAL_PROPERTIES; i++) {
  const cityObj = cities[(i - 1) % cities.length];
  const locality = cityObj.localities[(i - 1) % cityObj.localities.length];
  const builder = builders[(i - 1) % builders.length];
  
  const prefix = prefixes[i % prefixes.length];
  const suffix = suffixes[(i * 3) % suffixes.length];
  const name = `${builder} ${prefix} ${suffix}`;
  
  const bhkNum = (i % 5) + 1; // 1 to 5 BHK
  const pType = bhkNum === 5 ? '5 BHK Villa' : `${bhkNum} BHK Flat`;
  const area = bhkNum * 450 + getRandomNumber(50, 300);
  
  let baseRateSqft = 8500;
  
  const priceLakhs = Math.round(((area * baseRateSqft * (0.8 + Math.random() * 0.4)) / 100000) * 10) / 10;
  const age = ages[i % ages.length];
  const ageYears = age === '<1 yr' ? 0.5 : age === '1-5 yrs' ? 3 : age === '5-10 yrs' ? 7 : 12;

  // Pick 4-7 random amenities
  const numAmenities = getRandomNumber(4, 7);
  const selectedAmenities = [];
  while (selectedAmenities.length < numAmenities) {
    const a = getRandomItem(allAmenities);
    if (!selectedAmenities.includes(a)) selectedAmenities.push(a);
  }

  const auctionEnabled = (i % 8 === 0);

  const histBase = priceLakhs * 100000;
  const historicalPrices = {
    "2016": Math.round(histBase * 0.60),
    "2017": Math.round(histBase * 0.65),
    "2018": Math.round(histBase * 0.70),
    "2019": Math.round(histBase * 0.75),
    "2020": Math.round(histBase * 0.80),
    "2021": Math.round(histBase * 0.85),
    "2022": Math.round(histBase * 0.90),
    "2023": Math.round(histBase * 0.95),
    "2024": Math.round(histBase * 0.98),
    "2025": Math.round(histBase)
  };

  properties.push({
    id: `prop-${i}`,
    recordNumber: String(i),
    listingId: `1786023688-${i}`,
    title: name,
    name: name,
    listingTitle: `${bhkNum} BHK Flat in ${locality}, ${cityObj.name}`,
    propertyType: pType,
    configuration: `${bhkNum} BHK`,
    bhk: bhkNum,
    bathrooms: Math.min(bhkNum, 4),
    price: priceLakhs,
    priceRange4BHK: "N/A",
    priceRange5BHK: "N/A",
    area: area,
    areaType: getRandomItem(areaTypes),
    locality: locality,
    city: cityObj.name,
    zone: getRandomItem(['East', 'West', 'North', 'South', 'Central']),
    address: `${locality}, ${cityObj.name}`,
    postalCode: String(400000 + (i % 900)),
    projectName: name,
    builder: builder,
    seller: getRandomItem(sellers),
    sellerType: "Verified Partner",
    brokerageType: "Zero Brokerage",
    constructionStatus: getRandomItem(constructionStatuses),
    reraStatus: "Yes",
    listingAge: `${(i % 12) + 1}d ago`,
    age: age,
    ageYears: ageYears,
    floor: `${(i % 18) + 1}`,
    totalFloors: `${(i % 18) + 5}`,
    parking: "1 Covered",
    facing: getRandomItem(['East', 'North-East', 'North', 'West']),
    furnishing: getRandomItem(['Semi-Furnished', 'Fully-Furnished', 'Unfurnished']),
    priceSqft: Math.round((priceLakhs * 100000) / area),
    amenities: selectedAmenities,
    specialFeatures: "Modular Kitchen, High Speed Elevators, Vastu Compliant",
    description: `Spacious and elegantly designed ${bhkNum} BHK residence located in ${locality}, ${cityObj.name}. Features modern amenities, superb connectivity to IT hubs and commercial centers, and excelente capital appreciation potential.`,
    image: images[(i - 1) % images.length],
    lat: cityObj.lat + (Math.sin(i) * 0.05),
    lng: cityObj.lng + (Math.cos(i) * 0.05),
    sellerEmail: sellerEmails[i % sellerEmails.length],
    auctionEnabled: auctionEnabled,
    startingPrice: Math.round(priceLakhs * 0.85 * 10) / 10,
    minIncrement: 1.0,
    auctionEnd: auctionEnabled ? new Date(Date.now() + (i % 5 + 1) * 24 * 60 * 60 * 1000).toISOString() : null,
    bids: []
  });
}

fs.writeFileSync(PROPERTIES_FILE, JSON.stringify(properties, null, 2));

const CSV_FILE = path.join(__dirname, '../ml/datasets/Dataset.csv');
const headers = [
  'Record Number','Listing ID','Property URL','Property Title','Listing Title','Property Type','Configuration','Bedrooms','Bathrooms','Price','Price Range (4 BHK)','Price Range (5 BHK)','Area','Area Type','Locality','City','Zone','Address','Postal Code','Project Name','Builder / Owner','Seller Type','Brokerage Type','Construction Status','RERA Status','Listing Age','Floor','Total Floors','Parking','Facing','Furnishing','Price / Sqft','Amenities','Special Features','Description','Image URL 1','Image URL 2','Image URL 3','Image URL 4','Images URL','Source Search URL','Source Page URL','Source Row','Estimated Market Price 2016 (₹)','Estimated Market Price 2017 (₹)','Estimated Market Price 2018 (₹)','Estimated Market Price 2019 (₹)','Estimated Market Price 2020 (₹)','Estimated Market Price 2021 (₹)','Estimated Market Price 2022 (₹)','Estimated Market Price 2023 (₹)','Estimated Market Price 2024 (₹)','Estimated Market Price 2025 (₹)'
];

function escapeCsvCell(val) {
  if (val === null || val === undefined) return 'N/A';
  let str = String(val).trim();
  if (str === '') return 'N/A';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const csvRows = [headers.join(',')];
properties.forEach((p, idx) => {
  const priceLakhs = p.price || 100;
  const histBase = Math.round(priceLakhs * 100000);

  const row = [
    p.recordNumber || String(idx + 1),
    p.listingId || `1786023688-${idx + 1}`,
    'N/A',
    p.title || p.name || 'N/A',
    p.listingTitle || `${p.bhk || 2} BHK Flat in ${p.locality || 'Bangalore'}, ${p.city || 'Bangalore'}`,
    p.propertyType || 'Flat',
    p.configuration || `${p.bhk || 2} BHK`,
    p.bhk || 2,
    p.bathrooms || 2,
    `₹${p.price} Lac`,
    'N/A',
    'N/A',
    `${p.area} sqft`,
    p.areaType || 'Super Built-up Area',
    p.locality || 'N/A',
    p.city || 'Bangalore',
    p.zone || 'Central',
    p.address || 'N/A',
    p.postalCode || '400001',
    p.projectName || p.title || 'N/A',
    p.builder || 'N/A',
    p.sellerType || 'Verified Partner',
    p.brokerageType || 'Zero Brokerage',
    p.constructionStatus || 'Ready To Move',
    p.reraStatus || 'Yes',
    p.listingAge || '1d ago',
    p.floor || '1',
    p.totalFloors || '5',
    p.parking || '1 Covered',
    p.facing || 'East',
    p.furnishing || 'Semi-Furnished',
    `₹${p.priceSqft || 5000} /sqft`,
    Array.isArray(p.amenities) ? p.amenities.join(', ') : 'N/A',
    p.specialFeatures || 'N/A',
    p.description || 'N/A',
    p.image || 'N/A',
    'N/A','N/A','N/A',
    p.image || 'N/A',
    'N/A','N/A',
    idx + 1,
    Math.round(histBase * 0.60),
    Math.round(histBase * 0.65),
    Math.round(histBase * 0.70),
    Math.round(histBase * 0.75),
    Math.round(histBase * 0.80),
    Math.round(histBase * 0.85),
    Math.round(histBase * 0.90),
    Math.round(histBase * 0.95),
    Math.round(histBase * 0.98),
    histBase
  ];

  csvRows.push(row.map(escapeCsvCell).join(','));
});

fs.writeFileSync(CSV_FILE, csvRows.join('\n'));
console.log(`Successfully generated ${properties.length} properties in ${PROPERTIES_FILE} and ${CSV_FILE}`);


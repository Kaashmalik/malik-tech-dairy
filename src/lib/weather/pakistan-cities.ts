// Fixed Pakistan cities with exact OpenWeather API names
export const DEFAULT_PAKISTAN_CITIES = [
  {
    name: 'jatoi',
    displayName: 'Jatoi',
    province: 'Punjab',
    // Use nearby city that OpenWeather recognizes
    searchName: 'Muzaffargarh',  // Jatoi is in Muzaffargarh district
    latitude: 29.5654,
    longitude: 70.9271
  },
  {
    name: 'ali-pur',
    displayName: 'Ali Pur',
    province: 'Punjab',
    // Use nearby city that OpenWeather recognizes
    searchName: 'Muzaffargarh',  // Ali Pur is in Muzaffargarh district
    latitude: 29.5974,
    longitude: 71.0812
  },
  {
    name: 'muzzafargarh',
    displayName: 'Muzzafargarh',
    province: 'Punjab',
    // Correct spelling for OpenWeather
    searchName: 'Muzaffargarh',
    latitude: 30.0735,
    longitude: 71.1935
  },
  {
    name: 'lahore',
    displayName: 'Lahore',
    province: 'Punjab',
    searchName: 'Lahore',
    latitude: 31.5497,
    longitude: 74.3436
  },
  {
    name: 'karachi',
    displayName: 'Karachi',
    province: 'Sindh',
    searchName: 'Karachi',
    latitude: 24.8607,
    longitude: 67.0011
  },
  {
    name: 'islamabad',
    displayName: 'Islamabad',
    province: 'Federal',
    searchName: 'Islamabad',
    latitude: 33.6844,
    longitude: 73.0479
  },
  {
    name: 'faisalabad',
    displayName: 'Faisalabad',
    province: 'Punjab',
    searchName: 'Faisalabad',
    latitude: 31.4504,
    longitude: 73.1350
  },
  {
    name: 'multan',
    displayName: 'Multan',
    province: 'Punjab',
    searchName: 'Multan',
    latitude: 30.1575,
    longitude: 71.5249
  },
  {
    name: 'peshawar',
    displayName: 'Peshawar',
    province: 'KPK',
    searchName: 'Peshawar',
    latitude: 34.0151,
    longitude: 71.5249
  },
  {
    name: 'quetta',
    displayName: 'Quetta',
    province: 'Balochistan',
    searchName: 'Quetta',
    latitude: 30.1798,
    longitude: 66.9750
  }
];

export interface CategoryDef {
  label: string;
  group: string;
  /** OSM tag key -> allowed values (combined with OR) */
  tags: Record<string, string[]>;
}

export const CATEGORIES: Record<string, CategoryDef> = {
  restaurant: {
    label: "Restaurants",
    group: "Food & Drink",
    tags: { amenity: ["restaurant", "fast_food", "food_court"] },
  },
  cafe: {
    label: "Cafes & Coffee",
    group: "Food & Drink",
    tags: { amenity: ["cafe"] },
  },
  bar: {
    label: "Bars & Pubs",
    group: "Food & Drink",
    tags: { amenity: ["bar", "pub", "biergarten"] },
  },
  bakery: {
    label: "Bakeries",
    group: "Food & Drink",
    tags: { shop: ["bakery", "pastry"] },
  },
  grocery: {
    label: "Grocery & Food Shops",
    group: "Food & Drink",
    tags: {
      shop: ["supermarket", "convenience", "greengrocer", "butcher", "seafood", "cheese"],
    },
  },

  dentist: {
    label: "Dentists",
    group: "Health",
    tags: { healthcare: ["dentist"], amenity: ["dentist"] },
  },
  doctor: {
    label: "Doctors & Clinics",
    group: "Health",
    tags: { amenity: ["clinic", "doctors"], healthcare: ["doctor", "centre"] },
  },
  pharmacy: {
    label: "Pharmacies",
    group: "Health",
    tags: { amenity: ["pharmacy"], healthcare: ["pharmacy"] },
  },
  veterinary: {
    label: "Veterinarians",
    group: "Health",
    tags: { amenity: ["veterinary"] },
  },
  gym: {
    label: "Gyms & Fitness",
    group: "Health",
    tags: { leisure: ["fitness_centre", "sports_centre"] },
  },

  hotel: {
    label: "Hotels & Stays",
    group: "Travel",
    tags: { tourism: ["hotel", "guest_house", "hostel", "motel", "apartment"] },
  },
  travel_agency: {
    label: "Travel Agencies",
    group: "Travel",
    tags: { shop: ["travel_agency"] },
  },

  hairdresser: {
    label: "Hair & Beauty",
    group: "Beauty & Wellness",
    tags: { shop: ["hairdresser", "beauty", "nails", "massage"] },
  },

  car_repair: {
    label: "Car Repair",
    group: "Automotive",
    tags: { shop: ["car_repair", "car", "tyres", "car_parts"] },
  },
  car_wash: {
    label: "Car Wash & Detailing",
    group: "Automotive",
    tags: { amenity: ["car_wash"] },
  },
  driving_school: {
    label: "Driving Schools",
    group: "Automotive",
    tags: { amenity: ["driving_school"] },
  },

  real_estate: {
    label: "Real Estate Agencies",
    group: "Professional Services",
    tags: { office: ["estate_agent"], shop: ["estate_agent"] },
  },
  lawyer: {
    label: "Lawyers",
    group: "Professional Services",
    tags: { office: ["lawyer"] },
  },
  accountant: {
    label: "Accountants & Tax",
    group: "Professional Services",
    tags: { office: ["accountant", "tax_advisor", "financial"] },
  },
  insurance: {
    label: "Insurance Brokers",
    group: "Professional Services",
    tags: { office: ["insurance"] },
  },
  marketing: {
    label: "Marketing & Design",
    group: "Professional Services",
    tags: { office: ["marketing", "advertising_agency", "graphic_design", "consulting"] },
  },
  it_services: {
    label: "IT Services",
    group: "Professional Services",
    tags: { office: ["it", "company"], shop: ["computer"] },
  },

  plumber: {
    label: "Plumbers",
    group: "Trades",
    tags: { craft: ["plumber", "heating_engineer"] },
  },
  electrician: {
    label: "Electricians",
    group: "Trades",
    tags: { craft: ["electrician"] },
  },
  builder: {
    label: "Builders & Construction",
    group: "Trades",
    tags: { craft: ["builder", "carpenter", "roofer", "painter", "plasterer"] },
  },
  landscaping: {
    label: "Landscaping & Gardens",
    group: "Trades",
    tags: {
      craft: ["gardener"],
      shop: ["garden_centre", "garden_furniture"],
      landuse: [],
    },
  },

  retail: {
    label: "Retail Shops (all)",
    group: "Retail",
    tags: { shop: ["clothes", "shoes", "jewelry", "sports", "florist", "gift", "furniture", "electronics", "mobile_phone", "optician", "pet", "toys", "books", "second_hand"] },
  },

  education: {
    label: "Schools & Tutoring",
    group: "Education",
    tags: {
      amenity: ["school", "college", "language_school", "prep_school", "kindergarten"],
    },
  },

  events: {
    label: "Events & Venues",
    group: "Events",
    tags: { amenity: ["events_venue", "community_centre"], tourism: ["aquarium", "gallery", "museum"] },
  },
};

export const CATEGORY_GROUPS = Array.from(
  new Set(Object.values(CATEGORIES).map((c) => c.group))
);

export function categoryLabel(key: string): string {
  return CATEGORIES[key]?.label ?? key;
}

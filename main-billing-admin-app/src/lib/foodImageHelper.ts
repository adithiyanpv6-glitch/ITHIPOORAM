// Intelligent Food Image Auto-Fetcher for Ithi Pooram
// Automatically matches dish names with high-resolution, appetizing food photography to attract customers.

interface DishImageMatch {
  keywords: string[];
  imageUrl: string;
}

const CURATED_FOOD_IMAGES: DishImageMatch[] = [
  // Seafood Delicacies
  {
    keywords: ['karimeen', 'pollichathu', 'pearl spot'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['neymeen', 'king fish', 'seer fish', 'tawa fry'],
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['ayala', 'mackerel', 'fish fry'],
    imageUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['chemmeen', 'prawn', 'prawns', 'shrimp'],
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['koonthal', 'squid', 'calamari'],
    imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['crab', 'nandu'],
    imageUrl: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['fish curry', 'meen curry', 'kudampuli'],
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
  },

  // Meals & Rice
  {
    keywords: ['oonu', 'meals', 'sadhya', 'kerala meals'],
    imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['biryani', 'biriyani', 'dum biryani'],
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['nei choru', 'ghee rice', 'jeera rice', 'pulao'],
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80',
  },

  // Meats & Roasts
  {
    keywords: ['beef', 'beef fry', 'ularthiyathu', 'beef roast'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['chicken curry', 'nadan chicken', 'chicken roast'],
    imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['chicken fry', 'chicken 65', 'dragon chicken'],
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['mutton', 'lamb'],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  },

  // Breads & Breakfast
  {
    keywords: ['porotta', 'parotta', 'paratha'],
    imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['appam', 'idiyappam'],
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['dosa', 'masala dosa', 'ghee roast'],
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
  },

  // Beverages & Coolers
  {
    keywords: ['kulukki', 'sarbath', 'lime juice', 'mojito', 'juice'],
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['sambharam', 'moru', 'buttermilk', 'lassi'],
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['tea', 'chai', 'coffee', 'kappi'],
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  },

  // Desserts
  {
    keywords: ['payasam', 'pudding', 'elaneer', 'dessert', 'halwa'],
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
  },
  {
    keywords: ['ice cream', 'falooda', 'sundae'],
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop&q=80',
  },
];

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

/**
 * Automatically resolves a high quality food photograph from the web matching the dish title.
 */
export function autoFetchFoodImage(dishName: string): string {
  if (!dishName || !dishName.trim()) {
    return DEFAULT_FOOD_IMAGE;
  }

  const clean = dishName.toLowerCase().trim();

  // Search curated high-resolution matches first
  for (const item of CURATED_FOOD_IMAGES) {
    if (item.keywords.some((kw) => clean.includes(kw))) {
      return item.imageUrl;
    }
  }

  // Fallback to high quality culinary photography matching category keywords
  if (clean.includes('fish') || clean.includes('fry') || clean.includes('seafood')) {
    return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80';
  }
  if (clean.includes('curry') || clean.includes('gravy') || clean.includes('masala')) {
    return 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80';
  }
  if (clean.includes('rice') || clean.includes('meals') || clean.includes('choru')) {
    return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80';
  }
  if (clean.includes('sweet') || clean.includes('cake') || clean.includes('cream')) {
    return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80';
  }
  if (clean.includes('drink') || clean.includes('shake') || clean.includes('water')) {
    return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80';
  }

  return DEFAULT_FOOD_IMAGE;
}

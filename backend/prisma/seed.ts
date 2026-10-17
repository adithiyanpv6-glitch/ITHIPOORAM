import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING ITHI POORAM RESTAURANT DATABASE ---');

  // 1. Business Settings
  await prisma.businessSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      restaurantName: 'Ithi Pooram',
      malayalamName: 'ഇത്തിപ്പൂരം',
      tagline: 'Authentic Kerala Lunch & Seafood Spot',
      address: 'Opp. Old Secretariat Gate, MG Road, Statue, Trivandrum, Kerala 695001',
      phone: '+91 471 233 4567',
      email: 'counter@ithipooram.in',
      gstNumber: '32AAAAI0000A1Z5',
      fssaiNumber: '11324007000890',
      businessDayCutoffHour: 3,
      currencyCode: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      cgstPercent: 2.5,
      sgstPercent: 2.5,
      maxManagerDiscountPaise: 100000, // ₹1000
    },
  });

  // 2. Kitchen Stations
  const stationMain = await prisma.kitchenStation.upsert({
    where: { code: 'MAIN_KITCHEN' },
    update: {},
    create: {
      code: 'MAIN_KITCHEN',
      name: 'Main Meals & Curry Station',
      description: 'Kerala Sadhya/Meals, claypot fish curry, sambar, moru',
      isActive: true,
    },
  });

  const stationFry = await prisma.kitchenStation.upsert({
    where: { code: 'SEAFOOD_FRY' },
    update: {},
    create: {
      code: 'SEAFOOD_FRY',
      name: 'Tawa & Deep Fry Seafood Station',
      description: 'Hot sizzling fish fries, Karimeen, Neymeen, Ayala, Squid, Prawns',
      isActive: true,
    },
  });

  const stationBev = await prisma.kitchenStation.upsert({
    where: { code: 'BEVERAGE_COUNTER' },
    update: {},
    create: {
      code: 'BEVERAGE_COUNTER',
      name: 'Beverage & Dessert Counter',
      description: 'Fresh juices, Kulukki Sarbath, Tender coconut pudding',
      isActive: true,
    },
  });

  // 3. Employees / Users
  const salt = await bcrypt.genSalt(10);
  const hashPass = (p: string) => bcrypt.hashSync(p, salt);
  const hashPin = (pin: string) => bcrypt.hashSync(pin, salt);

  const usersData = [
    {
      username: 'owner',
      fullName: 'Sudheesh Nair (Proprietor)',
      passwordHash: hashPass('Owner@1234'),
      pinHash: hashPin('1122'),
      role: 'MAIN_ADMIN',
      phone: '+91 98470 12345',
    },
    {
      username: 'manager',
      fullName: 'Anand Varma (General Manager)',
      passwordHash: hashPass('Manager@1234'),
      pinHash: hashPin('3344'),
      role: 'MANAGER',
      phone: '+91 94471 23456',
    },
    {
      username: 'cashier1',
      fullName: 'Gokul Krishnan (Billing Counter 1)',
      passwordHash: hashPass('Cashier@1234'),
      pinHash: hashPin('5566'),
      role: 'CASHIER',
      phone: '+91 97452 34567',
    },
    {
      username: 'cashier2',
      fullName: 'Meera Rajesh (Billing Counter 2)',
      passwordHash: hashPass('Cashier@1234'),
      pinHash: hashPin('7788'),
      role: 'CASHIER',
      phone: '+91 98463 45678',
    },
    {
      username: 'kitchen1',
      fullName: 'Chef Raghavan (Head Chef - Main)',
      passwordHash: hashPass('Kitchen@1234'),
      pinHash: null,
      role: 'KITCHEN_STAFF',
      phone: '+91 99474 56789',
    },
    {
      username: 'kitchen2',
      fullName: 'Biju Master (Tawa Fry Specialist)',
      passwordHash: hashPass('Kitchen@1234'),
      pinHash: null,
      role: 'KITCHEN_STAFF',
      phone: '+91 94955 67890',
    },
    {
      username: 'menueditor',
      fullName: 'Deepak Store (Inventory In-Charge)',
      passwordHash: hashPass('Menu@1234'),
      pinHash: null,
      role: 'MENU_EDITOR',
      phone: '+91 98476 78901',
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash: u.passwordHash,
        pinHash: u.pinHash,
        role: u.role,
        fullName: u.fullName,
        isActive: true,
      },
      create: u,
    });
  }

  // 4. Tables Setup (TQ1 to TQ10) with Cryptographically Secure QR URL Tokens
  const tablesData = [
    { tableCode: 'TQ1', displayName: 'Table 1 (Verandah)', capacity: 4 },
    { tableCode: 'TQ2', displayName: 'Table 2 (Verandah)', capacity: 4 },
    { tableCode: 'TQ3', displayName: 'Table 3 (Courtyard AC)', capacity: 6 },
    { tableCode: 'TQ4', displayName: 'Table 4 (Courtyard AC)', capacity: 4 },
    { tableCode: 'TQ5', displayName: 'Table 5 (Inner Hall)', capacity: 4 },
    { tableCode: 'TQ6', displayName: 'Table 6 (Inner Hall)', capacity: 4 },
    { tableCode: 'TQ7', displayName: 'Table 7 (Heritage Corner)', capacity: 6 },
    { tableCode: 'TQ8', displayName: 'Table 8 (Family Room)', capacity: 8 },
    { tableCode: 'TQ9', displayName: 'Table 9 (Balcony View)', capacity: 4 },
    { tableCode: 'TQ10', displayName: 'Table 10 (Garden Gazebo)', capacity: 4 },
  ];

  for (const t of tablesData) {
    const existing = await prisma.restaurantTable.findUnique({
      where: { tableCode: t.tableCode },
    });

    const qrToken = existing?.qrToken || `qr_${t.tableCode.toLowerCase()}_${crypto.randomBytes(24).toString('hex')}`;

    const table = await prisma.restaurantTable.upsert({
      where: { tableCode: t.tableCode },
      update: {
        displayName: t.displayName,
        capacity: t.capacity,
      },
      create: {
        tableCode: t.tableCode,
        displayName: t.displayName,
        capacity: t.capacity,
        qrToken,
        qrActive: true,
        status: 'AVAILABLE',
      },
    });

    await prisma.tableQrToken.upsert({
      where: { token: qrToken },
      update: { isActive: true },
      create: {
        tableId: table.id,
        token: qrToken,
        isActive: true,
      },
    });
  }

  // 5. Menu Categories
  const catMeals = await prisma.menuCategory.upsert({
    where: { slug: 'kerala-meals' },
    update: {},
    create: {
      name: 'Kerala Meals & Rice',
      malayalamName: 'കേരള ഊണ് & ചോറ്',
      slug: 'kerala-meals',
      displayOrder: 1,
      isActive: true,
    },
  });

  const catSeafood = await prisma.menuCategory.upsert({
    where: { slug: 'seafood-fry-curry' },
    update: {},
    create: {
      name: 'Seafood Fry & Roasts',
      malayalamName: 'മീൻ വറുത്തത് & റോസ്റ്റ്',
      slug: 'seafood-fry-curry',
      displayOrder: 2,
      isActive: true,
    },
  });

  const catMeats = await prisma.menuCategory.upsert({
    where: { slug: 'kerala-meats-curries' },
    update: {},
    create: {
      name: 'Kerala Meats & Gravies',
      malayalamName: 'നാടൻ ഇറച്ചി കറികൾ',
      slug: 'kerala-meats-curries',
      displayOrder: 3,
      isActive: true,
    },
  });

  const catDrinks = await prisma.menuCategory.upsert({
    where: { slug: 'beverages-desserts' },
    update: {},
    create: {
      name: 'Drinks & Desserts',
      malayalamName: 'കുലുക്കി & മധുരം',
      slug: 'beverages-desserts',
      displayOrder: 4,
      isActive: true,
    },
  });

  // 6. Menu Items (with authentic prices in paise, stock, dietary)
  const menuItems = [
    // Meals
    {
      categoryId: catMeals.id,
      name: 'Special Kerala Seafood Oonu',
      malayalamName: 'സ്പെഷ്യൽ കടൽ മീൻ ഊണ്',
      description: 'Hot Matta rice, fish curry gravy, sambar, thoran, avial, moru curry, achar, pappadam & chammanthi',
      pricePaise: 16000, // ₹160
      dietary: 'SEAFOOD',
      imageUrl: '/images/meals_seafood.jpg',
      isAvailable: true,
      dailyStockLimit: 150,
      currentStock: 150,
      stationId: stationMain.id,
      displayOrder: 1,
    },
    {
      categoryId: catMeals.id,
      name: 'Traditional Veg Sadhya Lunch',
      malayalamName: 'നാടൻ പച്ചക്കറി ഊണ്',
      description: 'Authentic vegetarian sadhya meal served with 5 side curries, parippu ghee, rasam & payasam',
      pricePaise: 12000, // ₹120
      dietary: 'VEG',
      imageUrl: '/images/veg_sadhya.jpg',
      isAvailable: true,
      dailyStockLimit: 80,
      currentStock: 80,
      stationId: stationMain.id,
      displayOrder: 2,
    },
    {
      categoryId: catMeals.id,
      name: 'Kothu Porotta (Egg/Chicken)',
      malayalamName: 'കൊത്തു പൊറോട്ട',
      description: 'Shredded Malabar porotta tossed with spiced chicken masala, curry leaves and egg',
      pricePaise: 18000, // ₹180
      dietary: 'NON_VEG',
      imageUrl: '/images/kothu_porotta.jpg',
      isAvailable: true,
      dailyStockLimit: 40,
      currentStock: 40,
      stationId: stationMain.id,
      displayOrder: 3,
    },
    {
      categoryId: catMeals.id,
      name: 'Malabar Nei Choru (Ghee Rice)',
      malayalamName: 'നെയ്യ് ചോറ്',
      description: 'Fragrant jeerakasala rice cooked in pure ghee, fried onions, cashews and kismis',
      pricePaise: 14000, // ₹140
      dietary: 'VEG',
      imageUrl: '/images/ghee_rice.jpg',
      isAvailable: true,
      dailyStockLimit: 60,
      currentStock: 60,
      stationId: stationMain.id,
      displayOrder: 4,
    },

    // Seafood Fry & Roasts
    {
      categoryId: catSeafood.id,
      name: 'Karimeen Pollichathu (Banana Leaf)',
      malayalamName: 'കരിമീൻ പൊള്ളിച്ചത്',
      description: 'Pearl spot fish marinated in shallots, green chillies & wrapped in charred banana leaf',
      pricePaise: 38000, // ₹380
      dietary: 'SEAFOOD',
      imageUrl: '/images/karimeen_pollichathu.jpg',
      isAvailable: true,
      dailyStockLimit: 30,
      currentStock: 30,
      stationId: stationFry.id,
      displayOrder: 5,
    },
    {
      categoryId: catSeafood.id,
      name: 'Neymeen Tawa Fry (King Fish)',
      malayalamName: 'നെയ്മീൻ തവ ഫ്രൈ',
      description: 'Fresh cut king fish steak marinated in Trivandrum red chilli masala and pan-fried crisp with onion rings',
      pricePaise: 32000, // ₹320
      dietary: 'SEAFOOD',
      imageUrl: '/images/neymeen_fry.jpg',
      isAvailable: true,
      dailyStockLimit: 45,
      currentStock: 45,
      stationId: stationFry.id,
      displayOrder: 6,
    },
    {
      categoryId: catSeafood.id,
      name: 'Ayala Fry (Mackerel Sizzle)',
      malayalamName: 'അയില വറുത്തത്',
      description: 'Whole mackerel crisp-fried with crushed pepper, garlic, curry leaves and lemon slice',
      pricePaise: 14000, // ₹140
      dietary: 'SEAFOOD',
      imageUrl: '/images/ayala_fry.jpg',
      isAvailable: true,
      dailyStockLimit: 50,
      currentStock: 50,
      stationId: stationFry.id,
      displayOrder: 7,
    },
    {
      categoryId: catSeafood.id,
      name: 'Chemmeen Roast (Tiger Prawns)',
      malayalamName: 'ചെമ്മീൻ റോസ്റ്റ്',
      description: 'Plump coastal prawns slow roasted with coconut tidbits, shallots, and spicy pepper gravy',
      pricePaise: 29000, // ₹290
      dietary: 'SEAFOOD',
      imageUrl: '/images/chemmeen_roast.jpg',
      isAvailable: true,
      dailyStockLimit: 35,
      currentStock: 35,
      stationId: stationFry.id,
      displayOrder: 8,
    },
    {
      categoryId: catSeafood.id,
      name: 'Koonthal Pepper Fry (Squid Roast)',
      malayalamName: 'കൂന്തൽ പെപ്പർ ഫ്രൈ',
      description: 'Tender squid rings tossed with fresh crushed black pepper and caramelised onions',
      pricePaise: 26000, // ₹260
      dietary: 'SEAFOOD',
      imageUrl: '/images/koonthal_fry.jpg',
      isAvailable: true,
      dailyStockLimit: 25,
      currentStock: 25,
      stationId: stationFry.id,
      displayOrder: 9,
    },

    // Kerala Meats
    {
      categoryId: catMeats.id,
      name: 'Kerala Beef Fry (Ularthiyathu)',
      malayalamName: 'കേരള ബീഫ് ഉലർത്തിയത്',
      description: 'Slow roasted tender beef chunks with fried coconut slices, curry leaves, and traditional spices',
      pricePaise: 23000, // ₹230
      dietary: 'NON_VEG',
      imageUrl: '/images/beef_fry.jpg',
      isAvailable: true,
      dailyStockLimit: 50,
      currentStock: 50,
      stationId: stationMain.id,
      displayOrder: 10,
    },
    {
      categoryId: catMeats.id,
      name: 'Nadan Chicken Curry (Clay Pot)',
      malayalamName: 'നാടൻ ചിക്കൻ കറി',
      description: 'Country style chicken cooked in thick roasted coconut gravy with coriander and fennel',
      pricePaise: 21000, // ₹210
      dietary: 'NON_VEG',
      imageUrl: '/images/chicken_curry.jpg',
      isAvailable: true,
      dailyStockLimit: 40,
      currentStock: 40,
      stationId: stationMain.id,
      displayOrder: 11,
    },
    {
      categoryId: catMeats.id,
      name: 'Kerala Porotta (Per piece)',
      malayalamName: 'കേരള പൊറോട്ട',
      description: 'Flaky, multi-layered golden brown hot Malabar porotta',
      pricePaise: 1800, // ₹18
      dietary: 'VEG',
      imageUrl: '/images/porotta.jpg',
      isAvailable: true,
      dailyStockLimit: 300,
      currentStock: 300,
      stationId: stationMain.id,
      displayOrder: 12,
    },

    // Beverages & Desserts
    {
      categoryId: catDrinks.id,
      name: 'Special Kulukki Sarbath',
      malayalamName: 'സ്പെഷ്യൽ കുലുക്കി സർബത്ത്',
      description: 'Shaken lemonade with sabja seeds, green chilli slit, mint and crushed ice',
      pricePaise: 5000, // ₹50
      dietary: 'VEG',
      imageUrl: '/images/kulukki.jpg',
      isAvailable: true,
      dailyStockLimit: 100,
      currentStock: 100,
      stationId: stationBev.id,
      displayOrder: 13,
    },
    {
      categoryId: catDrinks.id,
      name: 'Spiced Sambharam (Moru Vellam)',
      malayalamName: 'നാടൻ സംഭാരം',
      description: 'Chilled Kerala buttermilk tempered with ginger, green chilli, shallots and curry leaves',
      pricePaise: 3500, // ₹35
      dietary: 'VEG',
      imageUrl: '/images/sambharam.jpg',
      isAvailable: true,
      dailyStockLimit: 120,
      currentStock: 120,
      stationId: stationBev.id,
      displayOrder: 14,
    },
    {
      categoryId: catDrinks.id,
      name: 'Tender Coconut Pudding (Elaneer Payasam)',
      malayalamName: 'ഇളനീർ പായസം / പുഡ്ഡിംഗ്',
      description: 'Velvety smooth dessert crafted from fresh tender coconut malai and condensed milk',
      pricePaise: 9000, // ₹90
      dietary: 'VEG',
      imageUrl: '/images/elaneer_pudding.jpg',
      isAvailable: true,
      dailyStockLimit: 40,
      currentStock: 40,
      stationId: stationBev.id,
      displayOrder: 15,
    },
  ];

  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name },
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: item,
      });
    } else {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: item,
      });
    }
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  console.log('Staff Credentials:');
  console.log('  Owner:        owner / Owner@1234 (PIN: 1122)');
  console.log('  Manager:      manager / Manager@1234 (PIN: 3344)');
  console.log('  Cashier 1:    cashier1 / Cashier@1234 (PIN: 5566)');
  console.log('  Cashier 2:    cashier2 / Cashier@1234 (PIN: 7788)');
  console.log('  Kitchen 1:    kitchen1 / Kitchen@1234');
  console.log('  Kitchen 2:    kitchen2 / Kitchen@1234');
  console.log('  Menu Editor:  menueditor / Menu@1234');
  console.log('Tables: TQ1 through TQ10 initialized with secure tokens.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

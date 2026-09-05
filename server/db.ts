import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Vendor from './models/Vendor';
import MenuCategory from './models/MenuCategory';
import MenuItem from './models/MenuItem';
import PickupSlot from './models/PickupSlot';

let mongoMemoryServer: MongoMemoryServer | null = null;

export async function connectDB() {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri.trim() === '') {
      console.log('No MONGODB_URI provided. Starting in-memory MongoDB server...');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 60000,
        },
      });
      mongoUri = mongoMemoryServer.getUri();
      console.log(`In-memory MongoDB started at: ${mongoUri}`);
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');

    await seedInitialDataIfNeeded();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

export async function seedInitialDataIfNeeded(force: boolean = false) {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0 && !force) {
      console.log('Database already initialized with seed data.');
      return;
    }

    if (force) {
      console.log('Force re-seeding database...');
      await User.deleteMany({});
      await Vendor.deleteMany({});
      await MenuCategory.deleteMany({});
      await MenuItem.deleteMany({});
      await PickupSlot.deleteMany({});
    }

    console.log('Seeding initial Campus Eats data...');
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 1. Admin Account
    const admin = await User.create({
      name: 'Campus Admin',
      email: 'admin@campuseats.edu',
      phone: '+91 9876543210',
      passwordHash: hashedPassword,
      role: 'admin',
      isActive: true,
    });

    // 2. Demo Student
    const student = await User.create({
      name: 'Alex Johnson',
      email: 'student@campuseats.edu',
      phone: '+91 9123456789',
      studentId: 'STU-2026-8891',
      passwordHash: hashedPassword,
      role: 'student',
      isActive: true,
    });

    // 3. Vendor 1: South Canteen Delights
    const vendor1User = await User.create({
      name: 'Ramesh Kumar',
      email: 'vendor1@campuseats.edu',
      phone: '+91 9811223344',
      passwordHash: hashedPassword,
      role: 'vendor',
      isActive: true,
    });

    const vendor1 = await Vendor.create({
      ownerId: vendor1User._id,
      name: 'South Canteen Delights',
      slug: 'south-canteen-delights',
      description: 'Authentic South Indian breakfast, crisp dosas, hot filter coffee, and mini thalis.',
      location: 'Food Court - Block A',
      phone: '+91 9811223344',
      openingTime: '08:00',
      closingTime: '20:00',
      status: 'APPROVED',
      isOpen: true,
      estimatedPreparationTime: 12,
      pickupSlotDuration: 15,
      pickupSlotCapacity: 10,
    });

    vendor1User.vendorId = vendor1._id as mongoose.Types.ObjectId;
    await vendor1User.save();

    // Menu Categories for Vendor 1
    const cat1_1 = await MenuCategory.create({ vendorId: vendor1._id, name: 'Breakfast & Dosas', sortOrder: 1 });
    const cat1_2 = await MenuCategory.create({ vendorId: vendor1._id, name: 'Meals & Rice', sortOrder: 2 });
    const cat1_3 = await MenuCategory.create({ vendorId: vendor1._id, name: 'Beverages', sortOrder: 3 });

    // Menu Items for Vendor 1
    await MenuItem.create([
      {
        vendorId: vendor1._id,
        categoryId: cat1_1._id,
        name: 'Masala Dosa',
        description: 'Crispy golden dosa filled with spiced potato masala, served with sambar and coconut chutney.',
        price: 60,
        image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
        preparationTime: 10,
        isAvailable: true,
        isVegetarian: true,
      },
      {
        vendorId: vendor1._id,
        categoryId: cat1_1._id,
        name: 'Idli Sambar (2 Pcs)',
        description: 'Steamed rice cakes served with hot lentil sambar and fresh chutneys.',
        price: 40,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
        preparationTime: 5,
        isAvailable: true,
        isVegetarian: true,
      },
      {
        vendorId: vendor1._id,
        categoryId: cat1_2._id,
        name: 'Mini South Thali',
        description: 'Rice, Sambar, Rasam, Poriyal, Curd, Papad, and Pickle.',
        price: 90,
        image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80',
        preparationTime: 15,
        isAvailable: true,
        isVegetarian: true,
      },
      {
        vendorId: vendor1._id,
        categoryId: cat1_3._id,
        name: 'Degree Filter Coffee',
        description: 'Traditional hot South Indian filter brew.',
        price: 25,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
        preparationTime: 3,
        isAvailable: true,
        isVegetarian: true,
      },
    ]);

    // 4. Vendor 2: Campus Brew & Bakes
    const vendor2User = await User.create({
      name: 'Ananya Sharma',
      email: 'vendor2@campuseats.edu',
      phone: '+91 9822334455',
      passwordHash: hashedPassword,
      role: 'vendor',
      isActive: true,
    });

    const vendor2 = await Vendor.create({
      ownerId: vendor2User._id,
      name: 'Campus Brew & Bakes',
      slug: 'campus-brew-bakes',
      description: 'Handcrafted artisan coffees, loaded grilled sandwiches, wraps, and fresh pastries.',
      location: 'Student Activity Center - Ground Floor',
      phone: '+91 9822334455',
      openingTime: '08:30',
      closingTime: '21:30',
      status: 'APPROVED',
      isOpen: true,
      estimatedPreparationTime: 10,
      pickupSlotDuration: 15,
      pickupSlotCapacity: 12,
    });

    vendor2User.vendorId = vendor2._id as mongoose.Types.ObjectId;
    await vendor2User.save();

    const cat2_1 = await MenuCategory.create({ vendorId: vendor2._id, name: 'Sandwiches & Wraps', sortOrder: 1 });
    const cat2_2 = await MenuCategory.create({ vendorId: vendor2._id, name: 'Cold Brews & Coffee', sortOrder: 2 });

    await MenuItem.create([
      {
        vendorId: vendor2._id,
        categoryId: cat2_1._id,
        name: 'Paneer Tikka Grilled Sandwich',
        description: 'Spiced paneer, bell peppers, melted cheese grilled to perfection in whole wheat bread.',
        price: 85,
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
        preparationTime: 10,
        isAvailable: true,
        isVegetarian: true,
      },
      {
        vendorId: vendor2._id,
        categoryId: cat2_1._id,
        name: 'Crispy Chicken Wrap',
        description: 'Juicy fried chicken strip wrapped with garlic mayo and lettuce.',
        price: 110,
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80',
        preparationTime: 12,
        isAvailable: true,
        isVegetarian: false,
      },
      {
        vendorId: vendor2._id,
        categoryId: cat2_2._id,
        name: 'Iced Hazelnut Cold Coffee',
        description: 'Creamy double-shot espresso blended with hazelnut syrup and chilled milk.',
        price: 75,
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80',
        preparationTime: 5,
        isAvailable: true,
        isVegetarian: true,
      },
    ]);

    // 5. Vendor 3: Dragon Wok Indo-Chinese
    const vendor3User = await User.create({
      name: 'Priya Patel',
      email: 'vendor3@campuseats.edu',
      phone: '+91 9833445566',
      passwordHash: hashedPassword,
      role: 'vendor',
      isActive: true,
    });

    const vendor3 = await Vendor.create({
      ownerId: vendor3User._id,
      name: 'Dragon Wok Indo-Chinese',
      slug: 'dragon-wok',
      description: 'Sizzling wok fried rice, Hakka noodles, steamed momos, and Manchurian bowls.',
      location: 'Food Court - Block B',
      phone: '+91 9833445566',
      openingTime: '11:00',
      closingTime: '22:00',
      status: 'APPROVED',
      isOpen: true,
      estimatedPreparationTime: 15,
      pickupSlotDuration: 15,
      pickupSlotCapacity: 8,
    });

    vendor3User.vendorId = vendor3._id as mongoose.Types.ObjectId;
    await vendor3User.save();

    const cat3_1 = await MenuCategory.create({ vendorId: vendor3._id, name: 'Rice & Noodles', sortOrder: 1 });
    const cat3_2 = await MenuCategory.create({ vendorId: vendor3._id, name: 'Momos & Starters', sortOrder: 2 });

    await MenuItem.create([
      {
        vendorId: vendor3._id,
        categoryId: cat3_1._id,
        name: 'Veg Hakka Noodles',
        description: 'Wok-tossed noodles with shredded vegetables and soya seasoning.',
        price: 80,
        image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
        preparationTime: 10,
        isAvailable: true,
        isVegetarian: true,
      },
      {
        vendorId: vendor3._id,
        categoryId: cat3_1._id,
        name: 'Chicken Schezwan Fried Rice',
        description: 'Spicy wok rice with egg, chicken chunks, and fiery Schezwan sauce.',
        price: 120,
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
        preparationTime: 15,
        isAvailable: true,
        isVegetarian: false,
      },
      {
        vendorId: vendor3._id,
        categoryId: cat3_2._id,
        name: 'Steamed Paneer Momos (6 Pcs)',
        description: 'Soft Himalayan dumplings stuffed with spiced cottage cheese, served with spicy dip.',
        price: 90,
        image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&q=80',
        preparationTime: 12,
        isAvailable: true,
        isVegetarian: true,
      },
    ]);

    // Generate pickup slots for today and tomorrow for all vendors
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const dates = [today, tomorrow];

    const vendorsList = [vendor1, vendor2, vendor3];

    for (const v of vendorsList) {
      for (const dateStr of dates) {
        // Generate slots between 09:00 and 20:00 at 15-min intervals
        let hour = 9;
        let minute = 0;

        while (hour < 20) {
          const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          let endMin = minute + 15;
          let endHour = hour;
          if (endMin >= 60) {
            endMin = 0;
            endHour += 1;
          }
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

          await PickupSlot.create({
            vendorId: v._id,
            date: dateStr,
            startTime,
            endTime,
            maxOrders: v.pickupSlotCapacity || 10,
            bookedOrders: Math.floor(Math.random() * 3), // small realistic booking count
            isActive: true,
          });

          minute += 15;
          if (minute >= 60) {
            minute = 0;
            hour += 1;
          }
        }
      }
    }

    console.log('Seed completed successfully!');
    console.log('Seed Accounts Created:');
    console.log('Admin: admin@campuseats.edu | Password: Password123!');
    console.log('Student: student@campuseats.edu | Password: Password123!');
    console.log('Vendors: vendor1@campuseats.edu, vendor2@campuseats.edu, vendor3@campuseats.edu | Password: Password123!');
  } catch (err) {
    console.error('Error during database seed:', err);
  }
}

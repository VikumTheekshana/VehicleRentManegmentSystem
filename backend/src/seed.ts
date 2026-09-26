import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Encryption helper
const hexKey = process.env.ENCRYPTION_MASTER_KEY || 'f8a3c2d1e0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a403';
const masterKey = Buffer.from(hexKey, 'hex');

function encrypt(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `enc:v1:${iv.toString('hex')}:${authTag}:${enc}`;
}

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in .env');
  }

  console.log('🌱 [VMS Database Seeder] Connecting to MongoDB Atlas...');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ [VMS Database Seeder] Connected successfully!');

  const db = mongoose.connection.db;

  // Clear existing collections for a fresh, clean demo
  const collections = ['users', 'vehicles', 'reservations', 'inspections', 'audit_logs'];
  for (const c of collections) {
    try {
      await db.collection(c).drop();
      console.log(`🧹 Dropped collection: ${c}`);
    } catch (e) {
      // collection might not exist yet
    }
  }

  console.log('👥 [1/4] Seeding 5 Role-Based Demo Users...');
  const salt = await bcrypt.genSalt(10);
  const hash = (pwd: string) => bcrypt.hashSync(pwd, salt);

  const users = [
    {
      fullName: 'Vikum Theekshana Dahanayake',
      email: 'admin@vms.com',
      passwordHash: hash('Admin@12345'),
      role: 'SUPER_ADMIN',
      phoneEncrypted: encrypt('+94771234567'),
      nicNumberEncrypted: encrypt('198512345678'),
      drivingLicenseEncrypted: encrypt('B1234567'),
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      fullName: 'Fleet Operations Manager',
      email: 'manager@vms.com',
      passwordHash: hash('Manager@12345'),
      role: 'FLEET_MANAGER',
      phoneEncrypted: encrypt('+94772345678'),
      nicNumberEncrypted: encrypt('198823456789'),
      drivingLicenseEncrypted: encrypt('B2345678'),
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      fullName: 'Front-Desk Rental Agent',
      email: 'agent@vms.com',
      passwordHash: hash('Agent@12345'),
      role: 'AGENT',
      phoneEncrypted: encrypt('+94773456789'),
      nicNumberEncrypted: encrypt('199234567890'),
      drivingLicenseEncrypted: encrypt('B3456789'),
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      fullName: 'Lead Fleet Mechanic',
      email: 'mechanic@vms.com',
      passwordHash: hash('Mechanic@12345'),
      role: 'MECHANIC',
      phoneEncrypted: encrypt('+94774567890'),
      nicNumberEncrypted: encrypt('199445678901'),
      drivingLicenseEncrypted: encrypt('B4567890'),
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      fullName: 'Corporate VIP Customer',
      email: 'customer@vms.com',
      passwordHash: hash('Customer@12345'),
      role: 'CUSTOMER',
      phoneEncrypted: encrypt('+94775678901'),
      nicNumberEncrypted: encrypt('199656789012'),
      drivingLicenseEncrypted: encrypt('B5678901'),
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const userDocs = await db.collection('users').insertMany(users);
  console.log(`✅ Seeded ${userDocs.insertedCount} users!`);

  console.log('🚗 [2/4] Seeding 8 Luxury & Commercial Fleet Vehicles...');
  const futureDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  const vehicles = [
    {
      vin: 'JTEBU25J80K012345',
      licensePlate: 'WP-CBM-4455',
      make: 'Toyota',
      model: 'Land Cruiser Prado TX-L',
      year: 2024,
      category: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Diesel',
      seatingCapacity: 7,
      mileage: 18450,
      fuelLevelPercentage: 90,
      dailyRate: 45000,
      securityDeposit: 100000,
      status: 'AVAILABLE',
      insuranceExpiry: futureDate(120),
      revenueLicenseExpiry: futureDate(180),
      isImmobilized: false,
      currentLocation: { type: 'Point', coordinates: [79.8428, 6.9344] },
      imageUrl: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      vin: 'WBA5A7100K0234567',
      licensePlate: 'WP-CAB-8899',
      make: 'BMW',
      model: '520d M-Sport Executive',
      year: 2023,
      category: 'LUXURY',
      transmission: 'Automatic',
      fuelType: 'Diesel',
      seatingCapacity: 5,
      mileage: 24200,
      fuelLevelPercentage: 85,
      dailyRate: 55000,
      securityDeposit: 150000,
      status: 'RENTED',
      insuranceExpiry: futureDate(90),
      revenueLicenseExpiry: futureDate(210),
      isImmobilized: false,
      currentLocation: { type: 'Point', coordinates: [79.8612, 6.9271] },
      imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      vin: 'WDD2050401K0345678',
      licensePlate: 'WP-CAD-7711',
      make: 'Mercedes-Benz',
      model: 'C200 AMG Line',
      year: 2023,
      category: 'LUXURY',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      mileage: 15800,
      fuelLevelPercentage: 100,
      dailyRate: 50000,
      securityDeposit: 120000,
      status: 'AVAILABLE',
      insuranceExpiry: futureDate(15), // Expiring soon!
      revenueLicenseExpiry: futureDate(150),
      isImmobilized: false,
      currentLocation: { type: 'Point', coordinates: [79.8550, 6.9100] },
      imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      vin: 'TRH20000K0456789',
      licensePlate: 'WP-PB-5522',
      make: 'Toyota',
      model: 'HiAce Super GL High Roof',
      year: 2022,
      category: 'VAN',
      transmission: 'Automatic',
      fuelType: 'Diesel',
      seatingCapacity: 14,
      mileage: 48900,
      fuelLevelPercentage: 75,
      dailyRate: 32000,
      securityDeposit: 60000,
      status: 'AVAILABLE',
      insuranceExpiry: futureDate(200),
      revenueLicenseExpiry: futureDate(25), // Expiring soon!
      isImmobilized: false,
      currentLocation: { type: 'Point', coordinates: [79.8800, 6.9000] },
      imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      vin: 'RU31000K0567890',
      licensePlate: 'WP-CBH-9933',
      make: 'Honda',
      model: 'Vezel e:HEV Z Package',
      year: 2024,
      category: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      seatingCapacity: 5,
      mileage: 12400,
      fuelLevelPercentage: 95,
      dailyRate: 24000,
      securityDeposit: 50000,
      status: 'AVAILABLE',
      insuranceExpiry: futureDate(300),
      revenueLicenseExpiry: futureDate(300),
      isImmobilized: false,
      currentLocation: { type: 'Point', coordinates: [79.8650, 6.9300] },
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      vin: 'KM8JN72D0K0678901',
      licensePlate: 'WP-CBE-6622',
      make: 'Hyundai',
      model: 'Tucson Signature AWD',
      year: 2023,
      category: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Petrol',
      seatingCapacity: 5,
      mileage: 31200,
      fuelLevelPercentage: 80,
      dailyRate: 28000,
      securityDeposit: 60000,
      status: 'AVAILABLE',
      insuranceExpiry: futureDate(150),
      revenueLicenseExpiry: futureDate(160),
      isImmobilized: false,
      currentLocation: { type: 'Point', coordinates: [79.8700, 6.8800] },
      imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      vin: 'ZC83S00K0789012',
      licensePlate: 'WP-CAY-1144',
      make: 'Suzuki',
      model: 'Swift RS Turbo Hybrid',
      year: 2023,
      category: 'COMPACT',
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      seatingCapacity: 5,
      mileage: 21500,
      fuelLevelPercentage: 100,
      dailyRate: 14000,
      securityDeposit: 35000,
      status: 'AVAILABLE',
      insuranceExpiry: futureDate(250),
      revenueLicenseExpiry: futureDate(280),
      isImmobilized: false,
      currentLocation: { type: 'Point', coordinates: [79.8500, 6.9400] },
      imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      vin: 'ZVW5000K0890123',
      licensePlate: 'WP-CAZ-3322',
      make: 'Toyota',
      model: 'Prius Prime Plugin Hybrid',
      year: 2023,
      category: 'SEDAN',
      transmission: 'Automatic',
      fuelType: 'Hybrid',
      seatingCapacity: 5,
      mileage: 34100,
      fuelLevelPercentage: 90,
      dailyRate: 20000,
      securityDeposit: 40000,
      status: 'AVAILABLE',
      insuranceExpiry: futureDate(180),
      revenueLicenseExpiry: futureDate(190),
      isImmobilized: false,
      currentLocation: { type: 'Point', coordinates: [79.8600, 6.9150] },
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const vehicleDocs = await db.collection('vehicles').insertMany(vehicles);
  console.log(`✅ Seeded ${vehicleDocs.insertedCount} vehicles!`);

  console.log('📋 [3/4] Seeding Live Active Reservation & Check-Out Inspection...');
  const customerId = userDocs.insertedIds[4]; // VIP Customer
  const agentId = userDocs.insertedIds[2]; // Rental Agent
  const rentedVehicleId = vehicleDocs.insertedIds[1]; // BMW 520d

  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() - 2); // 2 days ago
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 3); // 3 days from now

  const reservation = {
    reservationNumber: 'RES-2026-0001',
    customer: customerId,
    vehicle: rentedVehicleId,
    pickupDate,
    returnDate,
    totalDays: 5,
    dailyRate: 55000,
    rentalFee: 275000,
    securityDeposit: 150000,
    totalAmount: 425000,
    status: 'ACTIVE',
    isPaid: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const resDoc = await db.collection('reservations').insertOne(reservation);

  const checkOutInspection = {
    reservation: resDoc.insertedId,
    vehicle: rentedVehicleId,
    inspector: agentId,
    type: 'CHECK_OUT',
    odometerReading: 24200,
    fuelLevelPercentage: 85,
    damages: [
      {
        x: 42.5,
        y: 88.0,
        part: 'Rear Bumper Left Corner',
        severity: 'MINOR',
        description: 'Minor 2-inch clearcoat scratch',
        estimatedCost: 15000,
      },
    ],
    signatureBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    photos: [],
    notes: 'Vehicle handed over in pristine operational condition.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection('inspections').insertOne(checkOutInspection);

  console.log('🛡️ [4/4] Seeding Forensic Audit Trail...');
  await db.collection('audit_logs').insertOne({
    actorId: userDocs.insertedIds[0].toString(),
    actorEmail: 'admin@vms.com',
    actorRole: 'SUPER_ADMIN',
    action: 'SYSTEM_SEEDED',
    resource: 'System',
    metadata: {
      seededUsers: userDocs.insertedCount,
      seededVehicles: vehicleDocs.insertedCount,
      environment: 'MongoDB Atlas Free M0 Shared Cluster',
    },
    createdAt: new Date(),
  });

  console.log('====================================================');
  console.log('🎉 [VMS Database Seeder] Successfully seeded all demo entities!');
  console.log('====================================================');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});

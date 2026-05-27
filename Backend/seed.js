require('dotenv').config({ path: './.env' });

const mongoose = require('mongoose');
const Lead = require('./models/Lead');
const User = require('./models/User');

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
const SOURCES = ['website', 'referral', 'cold-call', 'email', 'social', 'other'];

const FIRST_NAMES = [
  'James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia',
  'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Charlotte', 'Alexander',
  'Amelia', 'Mason', 'Harper', 'Ethan', 'Evelyn', 'Daniel', 'Abigail',
  'Michael', 'Emily', 'Matthew', 'Elizabeth', 'Samuel', 'Sofia', 'Sebastian',
  'Avery', 'Jack', 'Ella', 'Owen', 'Scarlett', 'Aiden', 'Grace',
  'Raj', 'Priya', 'Arjun', 'Ananya', 'Vikram', 'Divya', 'Rohan', 'Pooja',
  'Chen', 'Wei', 'Ming', 'Fang', 'Carlos', 'Maria', 'Diego', 'Sofia',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Patel', 'Sharma', 'Kumar', 'Singh', 'Shah', 'Mehta', 'Gupta',
  'Wang', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao',
  'Kim', 'Park', 'Choi', 'Nakamura', 'Yamamoto', 'Tanaka',
];

const COMPANIES = [
  'TechNova Solutions', 'DataBridge Corp', 'CloudFirst Inc', 'InnovateTech',
  'Nexus Systems', 'PrimeSoft', 'AlphaWave Technologies', 'ByteForce',
  'Quantum Dynamics', 'Apex Analytics', 'Vertex Solutions', 'Fusion Labs',
  'Cascade Tech', 'Horizon Digital', 'Pinnacle Software', 'Orbit Innovations',
  'Catalyst Group', 'Pulse Ventures', 'Momentum Corp', 'Zenith Technologies',
  'CoreLogic', 'Streamline Systems', 'Catalyst AI', 'BlueSky Tech',
  'GreenPath Solutions', 'RedShift Analytics', 'Orbital Media', 'Synapse Networks',
  'Titan Consulting', 'Vanguard Digital', 'Stellar Systems', 'Nova Networks',
  'Ironclad Tech', 'Cloudwave', 'DataStream', 'Infodynamics', 'Techbridge',
  'Skywire Communications', 'Coastline Analytics', 'Summit Software',
  'Meridian Technologies', 'Parallax Solutions', 'Beacon Systems',
  'Lightspeed Software', 'Clearwater Tech', 'Stonebridge IT',
];

const OWNERS = [
  'Alice Johnson', 'Bob Martinez', 'Carol Williams', 'David Chen',
  'Eve Thompson', 'Frank Garcia', 'Grace Kim', 'Henry Patel',
  'Isabel Rodriguez', 'Jake Wilson',
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateLead(index) {
  const firstName = rand(FIRST_NAMES);
  const lastName = rand(LAST_NAMES);
  const name = `${firstName} ${lastName}`;
  const company = rand(COMPANIES);
  const emailDomain = company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${emailDomain}.com`;

  // Random date within past 2 years
  const createdAt = new Date(
    Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000
  );

  return {
    name,
    email,
    company,
    status: rand(STATUSES),
    owner: rand(OWNERS),
    source: rand(SOURCES),
    phone: `+1-${randInt(200, 999)}-${randInt(100, 999)}-${randInt(1000, 9999)}`,
    createdAt,
    updatedAt: createdAt,
  };
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Lead.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed demo users
    const users = await User.create([
      { name: 'Admin User', email: 'admin@crm.com', password: 'Admin@123', role: 'admin' },
      { name: 'Alice Johnson', email: 'alice@crm.com', password: 'Sales@123', role: 'manager' },
      { name: 'Bob Martinez', email: 'bob@crm.com', password: 'Sales@123', role: 'sales' },
    ]);
    console.log(`👥 Created ${users.length} users`);

    // Seed 12,000 leads in batches (MongoDB bulk insert max ~1000/batch)
    const TOTAL = 12000;
    const BATCH = 500;
    let inserted = 0;

    console.log(`📝 Seeding ${TOTAL} leads...`);

    for (let i = 0; i < TOTAL; i += BATCH) {
      const batch = Array.from({ length: Math.min(BATCH, TOTAL - i) }, (_, j) =>
        generateLead(i + j)
      );
      await Lead.insertMany(batch, { ordered: false });
      inserted += batch.length;
      process.stdout.write(`\r   Progress: ${inserted}/${TOTAL}`);
    }

    console.log(`\n✅ Seeded ${inserted} leads`);
    console.log('\n📋 Demo Accounts:');
    console.log('   Admin:   admin@crm.com  / Admin@123');
    console.log('   Manager: alice@crm.com  / Sales@123');
    console.log('   Sales:   bob@crm.com    / Sales@123');

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
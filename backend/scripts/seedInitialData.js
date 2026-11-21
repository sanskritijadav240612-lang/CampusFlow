import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Resource from '../src/models/Resource.js';

const seedInitialData = async () => {
  try {
    await connectDB();

    console.log('Seeding initial CampusFlow faculty and resource inventory...');

    // 1. Seed Faculty Member
    const facultyEmail = 'rajesh.faculty@campus.edu';
    const facultyId = 'FAC-CS-101';
    let faculty = await User.findOne({ email: facultyEmail });

    if (!faculty) {
      const passwordHash = await bcrypt.hash('FacultyPassword123!', 12);
      faculty = await User.create({
        name: 'Dr. Rajesh Kumar',
        email: facultyEmail,
        facultyId,
        passwordHash,
        role: 'faculty',
        isActive: true,
      });
      console.log(`✓ Faculty account created: ${faculty.name} (${faculty.email}) [ID: ${faculty.facultyId}]`);
    } else {
      console.log(`✓ Faculty account already exists: ${faculty.email}`);
    }

    // 2. Seed Initial Campus Resources
    const sampleResources = [
      {
        name: 'Main University Auditorium',
        category: 'Auditorium',
        resourceMode: 'capacity',
        capacity: 500,
        location: 'Central Campus, Block A, Level 1',
        description: 'Primary ceremonial auditorium equipped with tier seating and acoustic walling.',
      },
      {
        name: 'Rabindranath Tagore Seminar Hall',
        category: 'Seminar Hall',
        resourceMode: 'capacity',
        capacity: 120,
        location: 'Academic Complex, Block B, Floor 2',
        description: 'Air-conditioned seminar hall for workshops, academic presentations, and guest lectures.',
      },
      {
        name: 'Turing Computing Lab',
        category: 'Laboratory',
        resourceMode: 'capacity',
        capacity: 60,
        location: 'CS Department, Block C, Room 204',
        description: 'Dedicated computer laboratory with high-speed Ethernet and development workstations.',
      },
      {
        name: 'High-Lumen Laser Projector',
        category: 'Audio/Visual',
        resourceMode: 'quantity',
        totalQuantity: 6,
        location: 'Media Operations Centre, Room 102',
        description: '4K Ultra-HD portable laser presentation projectors with HDMI/Type-C inputs.',
      },
      {
        name: 'Wireless Handheld Microphones',
        category: 'Audio/Visual',
        resourceMode: 'quantity',
        totalQuantity: 12,
        location: 'AV Equipment Vault',
        description: 'Dual-channel UHF wireless dynamic handheld microphone units with battery chargers.',
      },
      {
        name: 'Portable Stage PA Sound System',
        category: 'Audio/Visual',
        resourceMode: 'quantity',
        totalQuantity: 4,
        location: 'AV Equipment Vault',
        description: '800W active speaker systems with tripod stands and Bluetooth audio receivers.',
      },
    ];

    for (const r of sampleResources) {
      const existing = await Resource.findOne({
        name: { $regex: new RegExp(`^${r.name}$`, 'i') },
      });

      if (!existing) {
        await Resource.create({
          ...r,
          isActive: true,
          scheduleVersion: 0,
          createdBy: faculty._id,
        });
        console.log(`✓ Created resource: ${r.name} (${r.resourceMode})`);
      } else {
        console.log(`✓ Resource already exists: ${r.name}`);
      }
    }

    console.log('\nInitial seeding completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  }
};

seedInitialData();

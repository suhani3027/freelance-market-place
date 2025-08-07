import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import { User } from './models/user.js';
import { FreelancerProfile } from './models/freelancerProfile.js';

async function createTestFreelancer() {
  try {
    await connectDB();
    
    console.log('=== CREATING TEST FREELANCER ===');
    
    // First, create a test user
    const testUser = new User({
      name: 'Test Freelancer',
      email: 'testfreelancer@example.com',
      password: 'password123',
      role: 'freelancer'
    });
    
    await testUser.save();
    console.log('✅ Created test user:', testUser.email);
    
    // Then create a freelancer profile
    const testProfile = new FreelancerProfile({
      userId: testUser._id.toString(),
      email: testUser.email,
      fullName: 'Test Freelancer',
      title: 'Web Developer',
      overview: 'Experienced web developer with expertise in React and Node.js',
      skills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS'],
      categories: ['Development & IT'],
      hourlyRate: 25,
      availability: 'Full-time',
      experienceLevel: 'Intermediate',
      englishLevel: 'Fluent',
      location: 'New York, USA',
      role: 'freelancer'
    });
    
    await testProfile.save();
    console.log('✅ Created test freelancer profile:', testProfile.email);
    
    console.log('\n=== TEST FREELANCER CREATED ===');
    console.log('Email: testfreelancer@example.com');
    console.log('Password: password123');
    console.log('Role: freelancer');
    
  } catch (error) {
    console.error('Error creating test freelancer:', error);
  } finally {
    process.exit(0);
  }
}

createTestFreelancer(); 
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import { User } from './models/user.js';
import { FreelancerProfile } from './models/freelancerProfile.js';

async function checkProfiles() {
  try {
    await connectDB();
    
    console.log('=== CHECKING DATABASE PROFILES ===');
    
    // Check Users
    const users = await User.find({});
    console.log('\n📊 USERS in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Check Freelancer Profiles
    const profiles = await FreelancerProfile.find({});
    console.log('\n📊 FREELANCER PROFILES in database:');
    profiles.forEach(profile => {
      console.log(`- ${profile.fullName || profile.email} (${profile.email}) - Role: ${profile.role}`);
    });
    
    // Check for freelancers specifically
    const freelancerUsers = await User.find({ role: 'freelancer' });
    console.log('\n👨‍💻 FREELANCER USERS:');
    freelancerUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });
    
    const freelancerProfiles = await FreelancerProfile.find({ role: 'freelancer' });
    console.log('\n👨‍💻 FREELANCER PROFILES:');
    freelancerProfiles.forEach(profile => {
      console.log(`- ${profile.fullName || profile.email} (${profile.email})`);
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Freelancer Profiles: ${profiles.length}`);
    console.log(`Users with role 'freelancer': ${freelancerUsers.length}`);
    console.log(`Profiles with role 'freelancer': ${freelancerProfiles.length}`);
    
  } catch (error) {
    console.error('Error checking profiles:', error);
  } finally {
    process.exit(0);
  }
}

checkProfiles(); 
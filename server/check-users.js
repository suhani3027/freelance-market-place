import { connectDB } from "./config/db.js";
import { User } from "./models/user.js";
import { FreelancerProfile } from "./models/freelancerProfile.js";

async function checkUsers() {
  try {
    await connectDB();
    
    console.log('=== CHECKING USERS ===');
    const users = await User.find({});
    console.log('Total users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n=== CHECKING FREELANCER PROFILES ===');
    const profiles = await FreelancerProfile.find({});
    console.log('Total freelancer profiles:', profiles.length);
    profiles.forEach(profile => {
      console.log(`- ${profile.fullName} (${profile.email}) - Title: ${profile.title}`);
    });
    
    console.log('\n=== SUMMARY ===');
    const clientUsers = users.filter(u => u.role === 'client');
    const freelancerUsers = users.filter(u => u.role === 'freelancer');
    console.log(`Clients: ${clientUsers.length}`);
    console.log(`Freelancers: ${freelancerUsers.length}`);
    console.log(`Completed freelancer profiles: ${profiles.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers(); 
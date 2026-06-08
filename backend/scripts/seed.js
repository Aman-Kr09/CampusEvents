require('dotenv').config();
const mongoose = require('mongoose');
const College = require('../models/College');
const User = require('../models/User');
const Event = require('../models/Event');
const Placement = require('../models/Placement');
const Announcement = require('../models/Announcement');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campusevents');
    console.log('Connected to database for seeding...');

    // Clear existing collections
    console.log('Clearing existing data...');
    await College.deleteMany({});
    await User.deleteMany({});
    await Event.deleteMany({});
    await Placement.deleteMany({});
    await Announcement.deleteMany({});
    await Question.deleteMany({});
    await Answer.deleteMany({});

    console.log('Creating Super Admin...');
    const superAdmin = await User.create({
      name: 'Super Admin User',
      email: 'superadmin@campusevents.com',
      password: 'SuperAdminSecure123!',
      role: 'SuperAdmin'
    });

    console.log('Creating Colleges...');
    const sit = await College.create({
      name: 'Stark Institute of Technology',
      state: 'New York',
      website: 'https://starkinstitute.edu',
      description: 'A premier institute focused on robotics, advanced materials, and sustainable energy applications.',
      status: 'Approved'
    });

    const wse = await College.create({
      name: 'Wayne School of Engineering',
      state: 'New Jersey',
      website: 'https://wayneengineering.edu',
      description: 'Renowned school dedicated to aerospace, cybersecurity, and micro-device components development.',
      status: 'Approved'
    });

    const lex = await College.create({
      name: 'Lex University',
      state: 'Metropolis',
      website: 'https://lexuniversity.edu',
      description: 'Modern university for biochemical engineering and aerospace logistics.',
      status: 'Pending'
    });

    console.log('Creating College Admins...');
    const sitAdmin = await User.create({
      name: 'Pepper Potts',
      email: 'starkadmin@sit.edu',
      password: 'Admin123!',
      role: 'Admin',
      college: sit._id
    });

    const wseAdmin = await User.create({
      name: 'Lucius Fox',
      email: 'wayneadmin@wse.edu',
      password: 'Admin123!',
      role: 'Admin',
      college: wse._id
    });

    console.log('Creating Sample Students...');
    const student1 = await User.create({
      name: 'Tony Stark Jr',
      email: 'tony@sit.edu',
      password: 'Student123!',
      role: 'Student',
      college: sit._id,
      interests: ['Coding', 'Robotics', 'Startups', 'AI/ML'],
      branch: 'Robotics Engineering',
      year: 3,
      badges: ['Inquisitive']
    });

    const student2 = await User.create({
      name: 'Peter Parker',
      email: 'peter@sit.edu',
      password: 'Student123!',
      role: 'Student',
      college: sit._id,
      interests: ['Research', 'Data Science', 'AI/ML', 'Photography'],
      branch: 'Biophysics',
      year: 2,
      badges: ['Helper']
    });

    const student3 = await User.create({
      name: 'Bruce Wayne Jr',
      email: 'bruce@wse.edu',
      password: 'Student123!',
      role: 'Student',
      college: wse._id,
      interests: ['Sports', 'Coding', 'Startups', 'Design'],
      branch: 'Cybersecurity',
      year: 4,
      badges: []
    });

    console.log('Creating Events...');
    const e1 = await Event.create({
      name: 'Arc Reactor Clean Energy Seminar',
      description: 'Learn about the latest innovations in clean energy systems, plasma containment, and the core engineering principles of miniaturized power grids. Highly recommended for students interested in mechanical, materials, and physics research.',
      banner: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
      time: '14:30',
      venue: 'Stark Auditorium A',
      category: 'Research',
      tags: ['Energy', 'Physics', 'Robotics'],
      registrationLink: 'https://starkinstitute.edu/energy-seminar',
      college: sit._id,
      createdBy: sitAdmin._id,
      status: 'Approved',
      views: 120,
      likes: [student1._id, student2._id],
      registrations: [student1._id]
    });

    const e2 = await Event.create({
      name: 'Hack-a-Thon 2026',
      description: 'Join the annual 36-hour code sprint to build cutting-edge algorithms and products. Topics range from artificial intelligence and machine learning models to distributed ledgers and secure communication protocols.',
      banner: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days later
      time: '09:00',
      venue: 'Computer Center Lab 4',
      category: 'Hackathons',
      tags: ['Coding', 'Hackathons', 'AI/ML'],
      registrationLink: 'https://starkinstitute.edu/hackathon2026',
      college: sit._id,
      createdBy: student1._id,
      status: 'Approved',
      views: 250,
      likes: [student1._id, student2._id],
      registrations: [student1._id, student2._id]
    });

    const e3 = await Event.create({
      name: 'Neural Network Architectures Workshop',
      description: 'Deep dive into training multilayer perceptrons, deep learning, convolutional neural networks (CNNs), and vision models using PyTorch. Ideal for anyone entering the AI and ML domains.',
      banner: 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?q=80&w=600&auto=format&fit=crop',
      date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days later
      time: '10:00',
      venue: 'AI Innovation Hub Hall',
      category: 'AI/ML',
      tags: ['AI/ML', 'Coding', 'Data Science'],
      registrationLink: 'https://starkinstitute.edu/nn-workshop',
      college: sit._id,
      createdBy: sitAdmin._id,
      status: 'Approved',
      views: 80,
      likes: [student2._id],
      registrations: [student2._id]
    });

    // Wayne School events
    await Event.create({
      name: 'Cybersecurity Threat Modeling Panel',
      description: 'A panel discussing zero-day prevention tactics, critical infrastructure defense, and modern network routing vulnerabilities. Recommended for cybersecurity research students.',
      banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      time: '16:00',
      venue: 'Wayne Hall B',
      category: 'Research',
      tags: ['Cybersecurity', 'Research', 'Coding'],
      registrationLink: 'https://wayneengineering.edu/threat-model',
      college: wse._id,
      createdBy: wseAdmin._id,
      status: 'Approved',
      views: 95,
      likes: [student3._id],
      registrations: [student3._id]
    });

    // Seed student1 events joined
    student1.eventsJoined.push(e2._id);
    await student1.save();
    student2.eventsJoined.push(e2._id, e3._id);
    await student2.save();

    console.log('Creating Placement Data...');
    await Placement.create({
      college: sit._id,
      highestPackage: 85.0,
      averagePackage: 18.5,
      placementPercentage: 92.4,
      companiesVisited: [
        { name: 'Stark Industries', status: 'Approved' },
        { name: 'Oscorp', status: 'Approved' },
        { name: 'Pym Tech', status: 'Approved' },
        { name: 'Google', status: 'Approved' },
        { name: 'Microsoft', status: 'Approved' }
      ],
      year: 2025
    });

    await Placement.create({
      college: sit._id,
      highestPackage: 92.5,
      averagePackage: 20.2,
      placementPercentage: 94.1,
      companiesVisited: [
        { name: 'Stark Industries', status: 'Approved' },
        { name: 'Oscorp', status: 'Approved' },
        { name: 'Pym Tech', status: 'Approved' },
        { name: 'Nvidia', status: 'Approved' },
        { name: 'Meta', status: 'Approved' }
      ],
      year: 2026
    });

    await Placement.create({
      college: wse._id,
      highestPackage: 75.0,
      averagePackage: 16.4,
      placementPercentage: 88.9,
      companiesVisited: [
        { name: 'Wayne Enterprises', status: 'Approved' },
        { name: 'LexCorp', status: 'Approved' },
        { name: 'Queen Industries', status: 'Approved' },
        { name: 'Amazon', status: 'Approved' },
        { name: 'Apple', status: 'Approved' }
      ],
      year: 2025
    });

    await Placement.create({
      college: wse._id,
      highestPackage: 82.0,
      averagePackage: 17.8,
      placementPercentage: 90.5,
      companiesVisited: [
        { name: 'Wayne Enterprises', status: 'Approved' },
        { name: 'LexCorp', status: 'Approved' },
        { name: 'Kord Industries', status: 'Approved' },
        { name: 'Netflix', status: 'Approved' },
        { name: 'OpenAI', status: 'Approved' }
      ],
      year: 2026
    });

    console.log('Creating Announcements...');
    await Announcement.create({
      college: sit._id,
      title: 'Robotics Lab Upgrade & Extension',
      content: 'We are pleased to announce that Stark Industries has funded a $15M extension to our robotics workshop. New high-precision metal 3D printers and carbon-composite curing chambers are now available for students working on mechanical and drone prototype research.',
      createdBy: sitAdmin._id
    });

    await Announcement.create({
      college: sit._id,
      title: 'Summer Internships Selection Process',
      content: 'Students in their 3rd year are requested to submit resumes for Stark Industries summer research internships before next Friday. Placements team will coordinate interview calls.',
      createdBy: sitAdmin._id
    });

    await Announcement.create({
      college: wse._id,
      title: 'Security Guidelines on Lab Networking',
      content: 'Following standard security upgrades, access to the engineering network via SSH now mandates two-factor key authentication. Please coordinate with the IT department for hardware token registration.',
      createdBy: wseAdmin._id
    });

    console.log('Creating QA Discussions...');
    const q1 = await Question.create({
      title: 'How do I start building a reinforcement learning model for drone navigation?',
      content: 'I want to build a drone prototype that learns to navigate an indoor obstacle course autonomously. Are there specific frameworks (e.g. StableBaselines3 or custom environments) that work best for physical microcontrollers like Raspberry Pi?',
      user: student1._id,
      college: sit._id,
      upvotes: [student1._id, student2._id],
      comments: [
        {
          user: student2._id,
          userName: student2.name,
          content: 'You should look into simulation environments like Webots or Gazebo first before uploading models to hardware.'
        }
      ],
      answersCount: 1
    });

    await Answer.create({
      question: q1._id,
      content: 'I highly suggest starting with StableBaselines3 in OpenAI Gym. You can train the model in a simulation environment using Gazebo. Once the policy behaves reasonably, export the policy network weights as an ONNX model, and load them using OpenCV DNN module or TensorFlow Lite on the Raspberry Pi. This prevents running high-overhead training loops directly on microcontrollers.',
      user: student2._id,
      upvotes: [student1._id]
    });

    const q2 = await Question.create({
      title: 'What should we prepare for Stark Industries internship interviews?',
      content: 'I have an interview coming up for the Advanced Avionics wing next week. What core subjects are tested? Should I focus more on control systems theory, structural analysis, or standard DSA coding rounds?',
      user: student2._id,
      college: sit._id,
      upvotes: [student2._id],
      answersCount: 1
    });

    await Answer.create({
      question: q2._id,
      content: 'For Stark Industries Advanced Avionics, they generally do two rounds. Round 1 tests real control theory, specifically PID loop tuning and Kalman filters. Round 2 is a practical coding session where you write algorithms in C++ or Python to map sensor readings. Standard LeetCode trees/graphs are rarely tested; instead, focus on systems programming and math.',
      user: student1._id,
      upvotes: [student2._id]
    });

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

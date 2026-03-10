#!/usr/bin/env node

/**
 * EduBridge Vercel Deployment Script
 * Automates the deployment process for the EduBridge platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 EduBridge Vercel Deployment Script');
console.log('=====================================\n');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI is installed');
} catch (error) {
  console.log('❌ Vercel CLI not found. Installing...');
  execSync('npm install -g vercel', { stdio: 'inherit' });
  console.log('✅ Vercel CLI installed');
}

// Check if user is logged in
try {
  execSync('vercel whoami', { stdio: 'pipe' });
  console.log('✅ Logged in to Vercel');
} catch (error) {
  console.log('❌ Not logged in to Vercel. Please login:');
  execSync('vercel login', { stdio: 'inherit' });
}

// Check for environment variables
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Creating from .env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created. Please edit it with your API keys.');
  }
}

// Check for OPENROUTER_API_KEY
const envContent = fs.readFileSync(envPath, 'utf8');
if (!envContent.includes('OPENROUTER_API_KEY=') || envContent.includes('your_openrouter_api_key_here')) {
  console.log('⚠️  OPENROUTER_API_KEY not set. Please update your .env file.');
  console.log('   Get your key from: https://openrouter.ai/');
}

// Install dependencies
console.log('📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });
console.log('✅ Dependencies installed');

// Build the project
console.log('🔨 Building project...');
execSync('npm run build:vercel', { stdio: 'inherit' });
console.log('✅ Build completed');

// Deploy to Vercel
console.log('🚀 Deploying to Vercel...');
try {
  execSync('vercel --prod', { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
  console.log('\n🎉 EduBridge is now live on Vercel!');
  console.log('   Check your Vercel dashboard for the deployment URL.');
} catch (error) {
  console.log('❌ Deployment failed. Please check the errors above.');
  console.log('   You can try manual deployment with: vercel --prod');
  process.exit(1);
}

// Set environment variables reminder
console.log('\n📝 Important: Set your environment variables in Vercel dashboard:');
console.log('   - OPENROUTER_API_KEY: Your OpenRouter API key');
console.log('   - Go to: Project Settings → Environment Variables');

console.log('\n🔗 Your app should be live at the URL shown above!');
console.log('   Demo features that work:');
console.log('   ✅ AI Tutor (with Gemini API key)');
console.log('   ✅ QR Code Sharing');
console.log('   ✅ Dashboard & Analytics');
console.log('   ⚠️  WebSocket features require separate backend deployment');
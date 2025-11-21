/**
 * Generate Apple Sign In Client Secret
 * 
 * Usage: node scripts/generate-apple-secret.js
 * 
 * You'll need:
 * - Your Team ID (from Apple Developer account)
 * - Your Key ID (from the key you created)
 * - Your Service ID (the identifier you created)
 * - Your private key file path (.p8 file)
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function generateSecret() {
  try {
    console.log('\n=== Apple Sign In Client Secret Generator ===\n');
    
    const teamId = await question('Enter your Team ID (10 characters): ');
    const keyId = await question('Enter your Key ID (10 characters): ');
    const serviceId = await question('Enter your Service ID (e.g., com.tmwy.app.signin): ');
    const keyPath = await question('Enter path to your .p8 private key file: ');
    
    // Read the private key
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    
    // Create JWT token
    const token = jwt.sign(
      {
        iss: teamId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (86400 * 180), // 6 months
        aud: 'https://appleid.apple.com',
        sub: serviceId,
      },
      privateKey,
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: keyId,
        },
      }
    );
    
    console.log('\n✅ Client Secret Generated!\n');
    console.log('Copy this value to your Supabase Apple provider settings:\n');
    console.log(token);
    console.log('\n⚠️  Note: This secret expires in 6 months. You\'ll need to regenerate it.\n');
    
  } catch (error) {
    console.error('\n❌ Error generating secret:', error.message);
    console.log('\nMake sure you have the jsonwebtoken package installed:');
    console.log('npm install jsonwebtoken\n');
  } finally {
    rl.close();
  }
}

generateSecret();


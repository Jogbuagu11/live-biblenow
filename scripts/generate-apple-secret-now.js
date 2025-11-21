/**
 * Generate Apple Sign In Client Secret
 * Quick generator using the existing .p8 file
 */

import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Get values from command line arguments or environment variables
const args = process.argv.slice(2);
const TEAM_ID = args[0] || process.env.APPLE_TEAM_ID || ''; // Your 10-character Team ID
const SERVICE_ID = args[1] || process.env.APPLE_SERVICE_ID || 'com.tmwy.app.signin'; // Your Service ID
const KEY_ID = 'W25N69WZ76'; // From the filename AuthKey_W25N69WZ76.p8
const P8_FILE_PATH = '/Users/jenniferogbuagu/Downloads/AuthKey_W25N69WZ76.p8';

function generateSecret() {
  try {
    // Check if .p8 file exists
    if (!fs.existsSync(P8_FILE_PATH)) {
      console.error('❌ .p8 file not found at:', P8_FILE_PATH);
      console.log('\nPlease update P8_FILE_PATH in the script or provide the correct path.\n');
      process.exit(1);
    }

    // Read the private key
    const privateKey = fs.readFileSync(P8_FILE_PATH, 'utf8');
    
    // Validate required fields
    if (!TEAM_ID || TEAM_ID.length !== 10) {
      console.error('❌ Team ID is required and must be 10 characters');
      console.log('\nUsage:');
      console.log('  node scripts/generate-apple-secret-now.js <TEAM_ID> [SERVICE_ID]');
      console.log('\nExample:');
      console.log('  node scripts/generate-apple-secret-now.js ABC123DEFG com.tmwy.app.signin');
      console.log('\nOr set environment variables:');
      console.log('  APPLE_TEAM_ID=ABC123DEFG APPLE_SERVICE_ID=com.tmwy.app.signin node scripts/generate-apple-secret-now.js\n');
      process.exit(1);
    }

    // Create JWT token (valid for 6 months)
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        iss: TEAM_ID,
        iat: now,
        exp: now + (86400 * 180), // 6 months from now
        aud: 'https://appleid.apple.com',
        sub: SERVICE_ID,
      },
      privateKey,
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: KEY_ID,
        },
      }
    );
    
    console.log('\n✅ Apple Sign In Client Secret Generated!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Copy this value to your Supabase Apple provider settings:\n');
    console.log(token);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Configuration used:');
    console.log(`  Team ID: ${TEAM_ID}`);
    console.log(`  Key ID: ${KEY_ID}`);
    console.log(`  Service ID: ${SERVICE_ID}`);
    console.log(`  Expires: ${new Date((now + (86400 * 180)) * 1000).toLocaleString()}\n`);
    console.log('⚠️  Note: This secret expires in 6 months. You\'ll need to regenerate it.\n');
    
  } catch (error) {
    console.error('\n❌ Error generating secret:', error.message);
    if (error.message.includes('PEM')) {
      console.log('\nThe .p8 file format might be incorrect. Make sure it\'s a valid Apple private key.\n');
    }
    process.exit(1);
  }
}

generateSecret();


const crypto = require('crypto');

function generateSalt(){
  return crypto.randomBytes(16).toString('hex');
}

// Create password hash using Password based key derivative function 2
function hashPassword(password) {
   const salt = generateSalt();
   const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex');
   return [salt, hash];
}

// Checking the password hash
function verifyHash(password, original, salt) {
  const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex');
  return hash === original
}

module.exports = {
  hashP = hashPassword,
  checkP = verifyHash,
  salt = generateSalt
}

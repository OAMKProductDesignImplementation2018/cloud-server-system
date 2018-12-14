const jwt = require('jsonwebtoken');

function generateAuthenticationToken(object)
{
  return jwt.sign( object , process.env['AUTH_SECRET']);
}

function verifyToken(token)
{
  return jwt.verify(token, process.env['AUTH_SECRET']);
}

module.exports = {
  auth : generateAuthenticationToken,
  ver : verifyToken
};

const jwt = require('jsonwebtoken');

function generateAuthenticationToken(object)
{
  return jwt.sign( object , 'secret');
}

function verifyToken(token)
{
  return jwt.verify(token, 'secret');
}

module.exports = {
  auth : generateAuthenticationToken,
  ver : verifyToken
};

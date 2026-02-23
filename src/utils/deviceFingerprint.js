const crypto = require('crypto');
const UAParser = require('ua-parser-js');

const generateDeviceFingerprint = (userAgent, ip) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const deviceSignature = `${result.browser.name}-${result.browser.version}-${result.os.name}-${result.os.version}-${result.device.vendor}-${result.device.model}`;

  const ipHash = crypto
    .createHash('sha256')
    .update(ip + process.env.JWT_SECRET)
    .digest('hex');

  const deviceHash = crypto
    .createHash('sha256')
    .update(deviceSignature)
    .digest('hex');

  return { ipHash, deviceHash };
};

const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    ''
  );
};

module.exports = {
  generateDeviceFingerprint,
  getClientIP,
};
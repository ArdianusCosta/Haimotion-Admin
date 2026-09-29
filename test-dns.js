const dns = require('dns');
dns.lookup('whois.id', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});

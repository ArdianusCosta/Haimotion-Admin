const net = require('net');
const client = net.connect({ host: '45.126.59.12', port: 43 }, () => {
  console.log('connected to server!');
  client.write('google.co.id\r\n');
});
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('error', (err) => {
  console.error(err);
});

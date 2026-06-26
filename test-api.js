const http = require('http');

const data = JSON.stringify({
  key: 'arn_terrain_v1',
  data: { terrainTint: '#ff0000' }
});

const options = {
  hostname: 'localhost',
  port: 3009,
  path: '/api/cms',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();

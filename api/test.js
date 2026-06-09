const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('https://www.youtube.com/api/timedtext', {
      params: {
        lang: 'en',
        v: 'M7lc1UVf-VE',
        fmt: 'json3'
      }
    });
    console.log('TYPE:', typeof res.data);
    console.log('KEYS:', Object.keys(res.data));
    console.log('PREVIEW:', JSON.stringify(res.data).substring(0, 200));
  } catch (err) {
    console.error(err.message);
  }
}
test();

const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

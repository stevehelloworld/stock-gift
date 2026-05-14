const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/update', (req, res) => {
  console.log('Triggering data update...');
  const scriptPath = path.join(__dirname, 'scripts/fetch-souvenirs.cjs');
  
  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ success: false, message: error.message });
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    res.json({ success: true, output: stdout });
  });
});

app.listen(port, () => {
  console.log(`Update server listening at http://localhost:${port}`);
});

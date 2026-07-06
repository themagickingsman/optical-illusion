const fs = require('fs/promises');
const path = require('path');
async function run() {
  const vnPath = path.join(process.cwd(), 'src/data/virtual_number.json');
  try {
    await fs.writeFile(vnPath, JSON.stringify({ active_number: null }));
    console.log("Success");
  } catch (err) {
    console.log("Error", err);
  }
}
run();

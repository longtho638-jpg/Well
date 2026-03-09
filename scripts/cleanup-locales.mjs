const fs = require('fs');
const dirs = ['en', 'vi'];
dirs.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*\.ts$/.test(f)) {
      console.log('Deleting:', dir + '/' + f);
      fs.unlinkSync(dir + '/' + f);
    }
  });
});
console.log('Done!');

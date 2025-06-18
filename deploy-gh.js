import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set environment variables
process.env.GITHUB_PAGES = 'true';

// Build the project
console.log('Building project for GitHub Pages...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Build error: ${error}`);
    console.log(stderr);
    process.exit(1);
  }
  
  console.log(stdout);
  
  // Post-build operations
  const distDir = path.join(__dirname, 'dist');

  // Create .nojekyll file
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  console.log('Created .nojekyll file');

  // Copy index.html to 404.html for SPA routing
  const indexContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(distDir, '404.html'), indexContent);
  console.log('Created 404.html for SPA routing');
  
  // Copy CNAME if exists
  try {
    if (fs.existsSync(path.join(__dirname, 'CNAME'))) {
      fs.copyFileSync(
        path.join(__dirname, 'CNAME'), 
        path.join(distDir, 'CNAME')
      );
      console.log('Copied CNAME file');
    }
  } catch (err) {
    console.log('No CNAME file found, skipping');
  }

  console.log('\nBuild completed successfully!');
  console.log('\nTo manually deploy:');
  console.log('1. cd dist');
  console.log('2. git init');
  console.log('3. git add -A');
  console.log('4. git commit -m "Deploy to GitHub Pages"');
  console.log('5. git push -f https://github.com/excelblazer/Bytsea_BankParser.git main:gh-pages');
  console.log('\nOr alternatively run the deploy.sh script if available.');
});

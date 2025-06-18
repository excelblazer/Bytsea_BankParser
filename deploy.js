// Enhanced script to build and deploy to GitHub Pages
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set environment variables for GitHub Pages
process.env.GITHUB_PAGES = 'true';

try {
  // Build the project
  console.log('Building project for GitHub Pages...');
  execSync('npm run build', { stdio: 'inherit' });

  const distDir = path.resolve(__dirname, 'dist');
  
  // Create .nojekyll file to prevent Jekyll processing
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  
  // Create a 404.html that redirects to index.html for SPA routing
  const indexContent = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(distDir, '404.html'), indexContent);
  
  // Copy the CNAME file if it exists in the root
  const cnameSource = path.join(__dirname, 'CNAME');
  const cnameDest = path.join(distDir, 'CNAME');
  if (fs.existsSync(cnameSource)) {
    fs.copyFileSync(cnameSource, cnameDest);
    console.log('CNAME file copied to distribution folder');
  }
  
  // GitHub specific - explicitly create paths that GitHub Pages might need
  const ghPagesPath = path.join(distDir, '.git', 'github-pages');
  if (!fs.existsSync(path.join(distDir, '.git'))) {
    fs.mkdirSync(path.join(distDir, '.git'), { recursive: true });
  }
  if (!fs.existsSync(ghPagesPath)) {
    fs.mkdirSync(ghPagesPath, { recursive: true });
  }
  
  console.log('Build completed successfully!');
  console.log('To deploy to GitHub Pages:');
  console.log('1. Navigate to the dist directory: cd dist');
  console.log('2. Initialize git: git init');
  console.log('3. Add all files: git add -A');
  console.log('4. Commit: git commit -m "Deploy to GitHub Pages"');
  console.log('5. Push to gh-pages branch: git push -f https://github.com/excelblazer/Bytsea_BankParser.git main:gh-pages');
  console.log('\nAlternatively, you can run the deploy.sh script for automatic deployment.');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

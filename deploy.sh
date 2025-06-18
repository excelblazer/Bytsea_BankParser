#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd dist

# if deploying to a custom domain
# echo 'www.example.com' > CNAME

# create empty .nojekyll file (prevents Jekyll processing)
touch .nojekyll

# initialize git in this folder
git init
git add -A
git commit -m 'Deploy to GitHub Pages'

# force push to the gh-pages branch
git push -f https://github.com/excelblazer/Bytsea_BankParser.git main:gh-pages

cd -

echo "Deployment complete"

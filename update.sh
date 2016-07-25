git clone https://github.com/Widdershin/cycle-community.git

# Yeah, I clone my repo into my repo, wanna fight about it?

cd cycle-community

cp -r ../node_modules .

./node_modules/babel-cli/bin/babel-node.js index.js

git config user.email "a-cron-job@example.org"
git config user.name "heroku-update.sh"

git config credential.helper store

echo https://$GIT_CREDENTIALS@github.com > ~/.git-credentials

git commit -am "Update issues in README"

git push origin master

rm ~/.git-credentials

cd ..

rm -rf cycle-community/.git
rm -r cycle-community

git clone https://github.com/cyclejs-community/cyclejs-community.git

# Yeah, I clone my repo into my repo, wanna fight about it?

cd cyclejs-community

cp -r ../node_modules .

./node_modules/babel-cli/bin/babel-node.js index.js

git config user.email "a-cron-job@example.org"
git config user.name "update.sh"

git config credential.helper store

echo https://$GIT_CREDENTIALS@github.com > ~/.git-credentials

git commit -am "Update issues in README"

git push origin master

rm ~/.git-credentials

cd ..

rm -rf cyclejs-community/.git
rm -r cyclejs-community

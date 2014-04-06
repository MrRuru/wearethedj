# Assume everything cloned in www

# Update
sudo apt-get update -y

# Global dependencies
sudo apt-get install python-software-properties build-essential -y

# Add repositories for edge packages
sudo add-apt-repository ppa:chris-lea/node.js -y
sudo add-apt-repository ppa:nginx/stable -y
sudo add-apt-repository ppa:chris-lea/redis-server -y
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
sudo apt-get update -y

# Install node
sudo apt-get install nodejs -y

# Install nginx
sudo apt-get install nginx -y

# Install redis
sudo apt-get install redis-server -y

# # Install sqlite
# sudo apt-get install sqlite3 -y


# Configure nginx
sudo cp /www/provision/conf/nginx.conf /etc/nginx/sites-available/app
sudo ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
sudo rm /etc/nginx/sites-enabled/default
sudo service nginx restart

# Install dependencies
cd /www
npm install
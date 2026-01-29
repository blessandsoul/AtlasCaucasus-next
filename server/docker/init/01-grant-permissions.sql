-- Grant all privileges to tourism_user for creating shadow databases
GRANT ALL PRIVILEGES ON *.* TO 'tourism_user'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

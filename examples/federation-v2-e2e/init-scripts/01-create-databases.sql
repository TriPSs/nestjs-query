-- Create databases for federation services
CREATE USER federation_user WITH SUPERUSER;
CREATE DATABASE federation_user;
GRANT ALL PRIVILEGES ON DATABASE federation_user TO federation_user;

CREATE USER federation_todo WITH SUPERUSER;
CREATE DATABASE federation_todo;
GRANT ALL PRIVILEGES ON DATABASE federation_todo TO federation_todo;

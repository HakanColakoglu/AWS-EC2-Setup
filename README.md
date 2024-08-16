# Setting Up an AWS EC2 Instance for a Node.js and PostgreSQL Project Using Docker Compose with SSH Agent Forwarding

## 1. Prerequisites

Before starting, ensure you have an AWS EC2 instance up and running. You will also need access to the `.pem` key file provided during the instance creation.

## 2. Connecting to Your EC2 Instance

### 2.1. Windows Users: Installing OpenSSH

If you are using Windows, you need to install OpenSSH to connect to your EC2 instance using SSH. Follow these steps:

1. **Open Settings:** Press `Win + I` to open Windows Settings.
2. **Navigate to Apps:** Go to `Apps` > `Optional Features`.
3. **Add a Feature:** Click on `Add a feature`, then search for **OpenSSH Client** and install it.

### 2.2. Linux Users: Connecting via SSH

On Linux, you can connect to your EC2 instance using the following commands:

1. **Set Permissions for the PEM File:**  
   ```bash
   chmod 400 "instance-name.pem"
   ```
   This command ensures that your `.pem` file is not publicly viewable, which is important for security.

2. **Connect to the Instance:**  
   ```bash
   ssh -i "./absolute/path/to/instance-name.pem" ubuntu@xxx.compute.amazonaws.com
   ```
   Replace `"./absolute/path/to/instance-name.pem"` with the actual path to your `.pem` file, and replace `ubuntu@xxx.compute.amazonaws.com` with your instance's public DNS.

### 2.3. Windows Users: Connecting via SSH

On Windows, you can connect using the following command in your terminal (assuming OpenSSH is installed):

```bash
ssh -i "C:\path\to\instance-name.pem" ubuntu@xxx.compute.amazonaws.com
```
Replace `"C:\path\to/instance-name.pem"` with the path to your `.pem` file and `ubuntu@xxx.compute.amazonaws.com` with your instance's public DNS.

## 3. Updating the Instance

Once connected to your EC2 instance, update the package list and upgrade the installed packages:

```bash
sudo apt update
sudo apt upgrade
```

## 4. Setting Up SSH Keys for Git Repository Access
Do this if you want to use your own git project. If you are using other methods, just skip this part, this is here to guide beginners.
### 4.1. Generate an SSH Key Pair

Run the following command to generate a new SSH key pair:

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

When prompted, press `Enter` to accept the default file location and optionally enter a passphrase.

### 4.2. Add the SSH Key to Your Git Repository

1. **Copy the SSH Public Key:**
   ```bash
   cat ~/.ssh/id_rsa.pub
   ```
   Copy the entire output.

2. **Add the SSH Key to Git Repository:**
   - **GitHub:**  
     Go to your GitHub account settings and navigate to **SSH and GPG keys** > **New SSH key**, then paste the key.


## 5. Setting Up Docker Environment with Docker Compose

### 5.1. Install Docker and Docker Compose on Your EC2 Instance

Install Docker on your instance:

```bash
sudo apt update
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
```

Install Docker Compose by following the official [Docker Compose installation instructions](https://docs.docker.com/compose/install/) or [Digital Ocean instructions](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-compose-on-ubuntu-20-04) which is a quite straightforward.


### 5.2. Create a Docker Compose File

In your project directory on the EC2 instance, create a `docker-compose.yml` file with the following content:

```yaml
version: '3'
services:
  node:
    image: node:latest
    container_name: node-app
    volumes:
      - .:/usr/src/app
    working_dir: /usr/src/app
    command: bash -c "npm install && npm start"
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    runtime: runc

  postgres:
    image: postgres:latest
    container_name: postgres-db
    environment:
      POSTGRES_PASSWORD: yourpassword
    ports:
      - "5432:5432"
    volumes:
      - ./pgdata:/var/lib/postgresql/data
```
If you are not familiar with docker-compose, here is a detailed explanation of important elements:

### 1. **`services:`**
   - This section defines the different services (containers) that will be part of your application. Each service will run in its own container.

### 2. **Service: `node`**
   - **`image: node:latest`**
     - Specifies the Docker image to use for this service. `node:latest` pulls the latest version of the official Node.js image from Docker Hub.
     
   - **`container_name: node-app`**
     - Assigns a custom name to the container. This is useful for easily identifying and managing the container. This name should be unique.
     
   - **`volumes:`**
     - Defines a volume mapping. The syntax is `host_path:container_path`.
     - `./:/usr/src/app`: Maps the current directory (`./`) on your host machine to the `/usr/src/app` directory inside the container. This allows for code to be edited on the host and run directly in the container. This will allow your container to access this project's files and run them. 
     
   - **`working_dir: /usr/src/app`**
     - Sets the working directory inside the container. All commands (like `npm install` and `npm start`) will be executed relative to this directory.
     
   - **`command: bash -c "npm install && npm start"`**
     - Specifies the command to run when the container starts. Here, it runs a bash shell command that first installs dependencies with `npm install` and then starts the Node.js application with `npm start`.
     
   - **`ports:`**
     - Maps ports from the container to the host machine.
     - `"3000:3000"` maps port 3000 of the container to port 3000 of the host. This makes the Node.js application accessible at `http://localhost:3000`.
     
   - **`depends_on:`
     - Specifies service dependencies. The `node` service will only start after the `postgres` service has been started.
     
   - **`runtime: runc`**
     - Specifies the runtime to use for the container. `runc` is the default runtime for Docker, responsible for running containers according to the OCI (Open Container Initiative) specifications.

### 4. **Service: `postgres`**
   - **`image: postgres:latest`**
     - Specifies the Docker image for the PostgreSQL service. `postgres:latest` pulls the latest version of the official PostgreSQL image.
     
   - **`container_name: postgres-db`**
     - Assigns a custom name to the PostgreSQL container.
     
   - **`environment:`**
     - Sets environment variables inside the container. In this case, it sets the `POSTGRES_PASSWORD` environment variable, which is required by PostgreSQL to set the password for the `postgres` user.
     
   - **`ports:`**
     - Maps ports from the container to the host machine.
     - `"5432:5432"` maps port 5432 of the container (default PostgreSQL port) to port 5432 on the host. This allows applications and tools on the host to connect to the PostgreSQL database.
     
   - **`volumes:`**
     - Defines a volume mapping.
     - `./pgdata:/var/lib/postgresql/data`: Maps the `pgdata` directory on the host machine to `/var/lib/postgresql/data` inside the container. This ensures that the database data is persisted on the host, so it is not lost when the container is stopped or removed. ./pgdata directory will be created if it doesn't exist yet, you can name it to something else. If you remove volume section from your file, you will loose all the set up and data in your database. 

### 5.3. Start the Containers

Run Docker Compose to build and start the containers.

```bash
sudo docker-compose up -d
```

This command starts both the Node.js and PostgreSQL containers, installs dependencies, and starts the application. Check if your containers are running.
You should see postgres container running but node-app is not running. 
```bash
sudo docker ps
```

Our node-app is trying to connect to a database which does not exit yet. We start a postgres container here, but we need to create a database and tables in it. 

Alternatively, you can start containers one by one. 

```bash
sudo docker-compose up -d postgres
```
Then create your database and tables, and start the main app once it is ready. Follow along to see how to set up your database.
```bash
sudo docker-compose up -d node
```

## 6. Configuring PostgreSQL

### 6.1. Access the PostgreSQL Container

```bash
sudo docker exec -it postgres-db bash
```

### 6.2. Set Up the Database and User

Switch to the `postgres` user and create the necessary database and user:

```bash
psql -U postgres
```

Then run the following SQL commands:

```sql
CREATE DATABASE blog;
CREATE ROLE blog_admin WITH LOGIN PASSWORD 'some_password';
GRANT ALL PRIVILEGES ON DATABASE "blog" TO blog_admin;
```
This will create your database. Now you will need to connect to your database and create a table. Use "\c blog" to connect
```sql
\c blog
```
Now that you are connected, you can create your table
```sql
CREATE TABLE blogposts (
    id SERIAL PRIMARY KEY,
    blogheader VARCHAR(255) NOT NULL,
    blogbody TEXT NOT NULL,
    blogauthor VARCHAR(100) NOT NULL
);
```
You will also need to grant access to the user so you can querry from your web application. 
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE blogposts TO blog_admin;
```
Since 'blogpost' table has serial id, you will also need to give an additional access to your user. 
```sql
GRANT USAGE, SELECT ON SEQUENCE blogposts_id_seq TO blog_admin;
```

### 6.3. Exit the PostgreSQL Terminal

Exit the PostgreSQL interactive terminal by typing:

```sql
\q
```

Then exit the container shell:

```bash
exit
```

In that case, you can update the section to include instructions specific to using `setup.sql` with `docker-compose`. Here’s how you can modify the documentation:

---

### 6.4. Setting Up PostgreSQL Database with `setup.sql`

If you want to automatize this process and initialize your PostgreSQL database with predefined schema and data, you can use a .sql file. Check out the provided `setup.sql` file. This file contains SQL statements which we manually entered before. You can read more [here](https://github.com/docker-library/docs/blob/master/postgres/README.md).

#### Using `setup.sql` with PostgreSQL and `docker-compose`

To use the `setup.sql` file with PostgreSQL in a `docker-compose` setup, follow these steps:

1. **Prepare Your `docker-compose.yml`**:
   Ensure your `docker-compose.yml` file is correctly configured to use the PostgreSQL image. An example configuration might look like this:

   ```yaml
   postgres:
    image: postgres:latest
    container_name: postgres-db
    environment:
      POSTGRES_PASSWORD: yourpassword
    ports:
      - "5432:5432"
    volumes:
      - ./pgdata:/var/lib/postgresql/data
      - ./setup.sql:/docker-entrypoint-initdb.d/setup.sql
   ```

  
   The `volumes` section mounts the `setup.sql` file into the container's `/docker-entrypoint-initdb.d/` directory, where it will be automatically executed upon container startup.

2. **Place the `setup.sql` File**:
   Ensure that your `setup.sql` file is located in the same directory as your `docker-compose.yml` file, or update the path accordingly in the `docker-compose.yml` file.

3. **Start the Services**:
   Run the following command in the directory where your `docker-compose.yml` is located to start the PostgreSQL container and execute the `setup.sql` file:
   ```bash
   docker-compose up -d
   ```

4. **Verify the Database Setup**:
   After the services are up, you can connect to the PostgreSQL database to verify that the schema and data were created as expected:
   ```bash
   docker exec -it <container_name> psql -U postgres -d <database_name>
   ```
   Replace `<container_name>` and `<database_name>`, in this project you can run:
   ```bash
   docker exec -it postgres-db psql -U postgres -d blog
   ```


## 7. Connecting Node.js to PostgreSQL

In your Node.js application, configure the connection to PostgreSQL using the service name `postgres`. This name was defined in your docker-compose file. If you change the service name to something else, update your `host` in here:

```javascript
import pg from "pg";
const db = new pg.Client({
  user: 'blog_admin',
  host: 'postgres',
  database: 'blog',
  password: 'some_password',
  port: 5432,
});
```
In this project, this is configured with .env file. 

```
DB_USER=blog_admin
DB_HOST=postgres
DB_DATABASE=blog
DB_PASSWORD=some_password
DB_PORT=5432
```
Normally, you should not hard code these details in your code and always use environment variables and you should never store your .env files somewhere public. It is only for this projects purpose that the .env file is included in the project. Just update the values in .env file according to your own credentials.

Now you can restart your container:
```bash
sudo docker-compose up -d node
```

Stop containers
```bash
sudo docker-compose down
```
Restart and see if your data was saved in database correctly.
```bash
sudo docker-compose up -d
```
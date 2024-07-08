# Media

This is an app to manage and view media files stored on a server

## Getting Started

### Installation

These instructions have been tested with Ubuntu 22.04

1. Make sure you have the following installed:

   ```sh
   git
   python3.10 or later
   node v18 or later (recommend to use nvm)
   PostgreSQL v14 or later
   ```

   On ubuntu, run:

   ```sh
   sudo apt install git python3.10 postgresql python3.10-venv ffmpeg
   ```

   See https://github.com/nvm-sh/nvm on how to install node via nvm.

2. Clone this repository

   ```sh
   git clone https://github.com/jbloggz/media.git
   ```

3. Setup a python virtual environment inside the repo directory, and install
   dependencies:

   ```sh
   # Run this from the top level of the repository. You may need to install the
   # venv package if it's not installed:
   python3 -m venv .pyvenv
   . .pyvenv/bin/activate
   pip3 install -r requirements.txt
   ```

4. Copy the .env.local.example to .env.local and update it to have the correct
   values.

   If you want to use google login, then uou will need to have a google account,
   and create a project for this app here: <https://console.cloud.google.com>. You
   then need to create OAuth credentials to use with this app here:
   <https://console.cloud.google.com/apis/credentials>

   If you want to use credentials login, you will need to create a base64 encoded
   bcrypt hash for every user. A simple way to do this is with the following
   command:

   ```sh
   python3 -c "from passlib.hash import bcrypt;import base64;print(base64.b64encode(bcrypt.hash('PASSWORD').encode()).decode())"
   ```

5. Setup PostgreSQL database

   5.1. Start the postgres server if it's not already running

   ```sh
   sudo systemctl start postgresql
   ```

   5.2. Connect to the database as the postgres user and create the media user and database

   ```
   sudo su - postgres -c psql
   postgres=# CREATE USER media PASSWORD 'XXXX';
   postgres=# CREATE DATABASE media WITH OWNER media;
   postgres=# quit
   ```

   5.3. Update the pg_hba.conf to match your preferred setup. You can find this
   file by connecting to postgres and running `SHOW hba_file;`. See
   <https://www.postgresql.org/docs/current/auth-pg-hba-conf.html> for how to
   modify this file to match your setup. The simplest method is to use the
   'trust' auth-method for local connections, like this:

   ```sh
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   local   media           media                                   trust
   ```

   Make sure you reload postgres when changing this file:

   ```sh
   sudo systemctl reload postgresql
   ```

   5.4. Create the database schema by running:

   ```sh
   psql -U media < schema.sql
   ```

6. Run the app!
   ```sh
   npm install
   npm run build
   npm start
   ```

## Processing media files

### Manual

The easiest way to process some media files and insert them into the app
is to manually run the processor script. This can be done by running the
the following command (make sure you have activated the python virtual
environment you created earlier):

```sh
python3 src/py/processor.py -e .env.local -p /path/to/media
```

This will recurse into the directory provided by `-p` and process any media
files that it is able to. You can safely call this multiple times on the
same directory and it will only process new files that it hasn't seen
previously.

You could set this up as a cron task to regularly process new files that
are added to the path.

### Automated

A more efficient and quicker way to get new media files into the app is to
setup automated processing using the processor python library. This involves
writing a python script that runs the processor based on whatever triggers
and files you need.
You can write
your own python script in `src/py` that imports the processor library and
runs it automatically. Use `src/py/syncthing.py` as an example of how this
can be done.

#### Syncthing

Out of the box, the media app comes with an automated processor for
[Syncthing](https://syncthing.net), found at `src/py/syncthing.py`. This script
monitors the syncthing API for events when files are sync'd locally. It then
copies files from the Syncthing folder to the media app repository and processes
those new files.

It is NOT recommended to setup syncthing to syncronise files directly to the
media app repository. This is because Syncthing may remove files if they are
removed from the remote source (eg. if you are cleaning up space on your phone).
Instead, you should setup Syncthing to syncronise to another location, and use
the `syncthing.py` script to copy files into the media app repository.

The script takes a list of src/dst paths, and will copy all files in the src to
the dst. An example 'paths' file can be found at `src/py/syncthing_paths.example.json`.
Existing files in `dst` will never be overwritten or deleted. This means that
the Syncthing location can be used as a temporary cache that feeds the media app.

To start the Syncthing automated processor, follow these steps:

1. Install Syncthing on the server (and the remote devices)

2. Setup any number of folders that are shared between the server and remote
   devices. It is recommended to set the folders to 'send only' on remote
   devices and 'receive only' on the server.

3. Run the syncthing.py script (make sure you have activated the python virtual
   environment you created earlier). You can also use something like
   [Supervisor](http://supervisord.org/) to make sure it stays alive. Use the
   `--help` option on `syncthing.py` script to learn what arguments you need to
   pass to it.

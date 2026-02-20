# FlyPatternDB — Complete Setup Guide

This guide walks you through setting up FlyPatternDB on your computer from scratch. No prior coding experience is required.

---

## What You Will Need

1. **A computer** running Windows, macOS, or Linux
2. **An internet connection**
3. About **30 minutes** of your time

---

## Step 1: Install Node.js

Node.js is the engine that runs the application.

### On Windows

1. Open your web browser and go to: https://nodejs.org
2. Click the big green button that says **"LTS"** (Long Term Support)
3. A file will download (e.g., `node-v22.x.x-x64.msi`)
4. Double-click the downloaded file
5. Click **"Next"** through all the screens, accepting the defaults
6. Click **"Install"**, then **"Finish"**

### On macOS

1. Open your web browser and go to: https://nodejs.org
2. Click the big green button that says **"LTS"**
3. A file will download (e.g., `node-v22.x.x.pkg`)
4. Double-click the downloaded file
5. Click **"Continue"** through all the screens
6. Click **"Install"**, enter your password when asked, then click **"Close"**

### Verify It Worked

1. **On Windows:** Press `Windows Key + R`, type `cmd`, and press Enter
2. **On macOS:** Press `Cmd + Space`, type `Terminal`, and press Enter
3. In the window that opens, type the following and press Enter:

```
node --version
```

You should see something like `v22.22.0`. If you see an error, restart your computer and try again.

---

## Step 2: Install PostgreSQL

PostgreSQL is the database that stores all the fly pattern data.

### Option A: Use a Free Cloud Database (Easiest)

1. Go to https://supabase.com and click **"Start your project"**
2. Sign up with your GitHub account (or create one at https://github.com)
3. Click **"New Project"**
4. Enter these details:
   - **Name:** `flypatterndb`
   - **Database Password:** Choose a strong password and **write it down**
   - **Region:** Pick the one closest to you
5. Click **"Create new project"** and wait about 2 minutes
6. Once ready, click **"Settings"** (gear icon) in the left sidebar
7. Click **"Database"**
8. Under **"Connection string"**, find the **"URI"** tab
9. Copy the connection string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
10. Replace `[YOUR-PASSWORD]` with the password you chose in step 4

### Option B: Install PostgreSQL Locally

#### On Windows
1. Go to https://www.postgresql.org/download/windows/
2. Click **"Download the installer"**
3. Download the latest version
4. Run the installer, clicking **"Next"** through each screen
5. When asked for a password, enter one and **write it down**
6. Keep the default port as `5432`
7. Click **"Next"** until installation completes

#### On macOS
1. Go to https://postgresapp.com
2. Click **"Downloads"** and download the latest version
3. Open the downloaded file and drag Postgres to your Applications folder
4. Open Postgres from your Applications folder
5. Click **"Initialize"** to create a new database server

Your local connection string will be:
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/flypatterndb
```

If using Postgres.app on macOS, it is:
```
postgresql://localhost:5432/flypatterndb
```

**Create the database** (local install only):

1. Open your terminal/command prompt
2. Type: `psql -U postgres` (enter password if asked)
3. Type: `CREATE DATABASE flypatterndb;`
4. Type: `\q` to exit

---

## Step 3: Download the Project

### Option A: Using Git (Recommended)

If you have Git installed:
```
git clone <your-repository-url> flypatterndb
cd flypatterndb
```

### Option B: Download ZIP

1. Download the project as a ZIP file from your repository
2. Extract/unzip it to a folder on your computer
3. Open terminal/command prompt and navigate to that folder:
   ```
   cd path/to/flypatterndb
   ```

---

## Step 4: Configure the Database Connection

1. In the project folder, find the file named `.env.example`
2. Make a copy of it and rename the copy to `.env`
   - **On Windows (Command Prompt):** `copy .env.example .env`
   - **On macOS/Linux (Terminal):** `cp .env.example .env`
3. Open the `.env` file in any text editor (Notepad, TextEdit, etc.)
4. Replace the `DATABASE_URL` value with your actual database connection string from Step 2:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/flypatterndb"
   ```
5. Save and close the file

---

## Step 5: Install Project Dependencies

Open your terminal/command prompt in the project folder and run:

```
npm install
```

This will download all the libraries the project needs. It may take 1-3 minutes. You will see a progress bar and various messages — this is normal.

---

## Step 6: Set Up the Database Tables

Run the following command to create all the database tables:

```
npx prisma db push
```

You should see a message saying the database is in sync.

---

## Step 7: Load Example Data

Run this command to fill the database with example fly patterns:

```
npm run db:seed
```

You should see output listing the materials, patterns, and other data that was created.

---

## Step 8: Start the Application

Run:

```
npm run dev
```

You should see output like:

```
  ▲ Next.js 15.x.x
  - Local:   http://localhost:3000
```

---

## Step 9: Open in Your Browser

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Go to: **http://localhost:3000**
3. You should see the FlyPatternDB homepage with the four example fly patterns!

---

## How to Stop the Application

In the terminal where it is running, press `Ctrl + C` (on both Windows and macOS).

---

## How to Start It Again Later

1. Open terminal/command prompt
2. Navigate to the project folder: `cd path/to/flypatterndb`
3. Run: `npm run dev`
4. Open http://localhost:3000 in your browser

---

## Useful Commands Reference

| Command | What It Does |
|---|---|
| `npm run dev` | Starts the application in development mode |
| `npm run build` | Builds the application for production |
| `npm start` | Runs the production build |
| `npm run lint` | Checks the code for errors |
| `npm run format` | Auto-formats the code |
| `npm run db:seed` | Loads example data into the database |
| `npm run db:studio` | Opens a visual database browser |
| `npx prisma db push` | Syncs database tables with the schema |
| `npx prisma migrate dev` | Creates and runs database migrations |

---

## Troubleshooting

### "command not found: node"
Node.js is not installed or not in your system PATH. Restart your computer after installing Node.js.

### "Cannot connect to database"
- Make sure PostgreSQL is running
- Double-check your `DATABASE_URL` in the `.env` file
- Make sure the database `flypatterndb` exists (for local installs)

### "Port 3000 is already in use"
Another application is using port 3000. Either close that application, or run:
```
npx next dev -p 3001
```
Then open http://localhost:3001 instead.

### "prisma: command not found"
Run `npm install` again to make sure all dependencies are installed.

---

## Project Structure

```
flypatterndb/
├── prisma/
│   ├── schema.prisma      # Database table definitions
│   └── seed.ts             # Example data
├── src/
│   ├── app/                # Pages and API routes
│   │   ├── api/            # Backend API endpoints
│   │   ├── patterns/       # Pattern detail pages
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Shared page layout
│   │   └── page.tsx        # Home page
│   ├── components/         # Reusable UI components
│   ├── lib/                # Shared utilities and config
│   └── services/           # Database query functions
├── .env.example            # Environment variable template
├── package.json            # Project dependencies
└── SETUP.md                # This file
```

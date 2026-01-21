# Quick Setup Guide

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (or use Docker)
- **Git**

## Option 1: Docker (Recommended for Quick Start)

The easiest way to run the entire application:

```bash
# Clone the repository
git clone <your-repo-url>
cd expense-tracker

# Start all services (PostgreSQL, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

**That's it!** The application is running.

To stop:
```bash
docker-compose down
```

To rebuild after changes:
```bash
docker-compose up -d --build
```

## Option 2: Manual Setup

### Step 1: PostgreSQL Setup

Install PostgreSQL and create the database:

```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql-14

# Create database
psql -U postgres
CREATE DATABASE expense_tracker;
\q
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env with your database credentials
# nano .env  or  code .env

# Example .env:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=expense_tracker
# DB_USER=postgres
# DB_PASSWORD=your_password

# Initialize database (creates tables)
npm run migrate

# Start development server
npm run dev

# The backend will run on http://localhost:3001
```

### Step 3: Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit if needed (default should work)
# nano .env  or  code .env

# Start development server
npm start

# The frontend will open at http://localhost:3000
```

## Verification

1. **Backend Health Check**
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Create Test Expense**
   ```bash
   curl -X POST http://localhost:3001/expenses \
     -H "Content-Type: application/json" \
     -H "Idempotency-Key: $(uuidgen)" \
     -d '{
       "amount": "50.00",
       "category": "food",
       "description": "Test expense",
       "date": "2026-01-21"
     }'
   ```

3. **List Expenses**
   ```bash
   curl http://localhost:3001/expenses
   ```

4. **Open Browser**
   - Navigate to http://localhost:3000
   - You should see the Expense Tracker UI
   - Try adding an expense

## Common Issues

### Backend won't start

**Error: "ECONNREFUSED" or "database does not exist"**
- Ensure PostgreSQL is running: `pg_isadmin`
- Check database exists: `psql -U postgres -l`
- Verify .env credentials match your PostgreSQL setup

**Error: "Port 3001 already in use"**
- Stop other applications using port 3001
- Or change PORT in backend/.env

### Frontend won't start

**Error: "Port 3000 already in use"**
- React will prompt to use another port (usually 3001)
- Or stop other applications using port 3000

**Error: "Cannot connect to backend"**
- Ensure backend is running on port 3001
- Check REACT_APP_API_URL in frontend/.env

### Database migration fails

**Error: "permission denied"**
- Ensure your PostgreSQL user has create table permissions
- Try: `GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO postgres;`

## Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## Production Build

### Backend
```bash
cd backend
NODE_ENV=production npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build folder with any static server
npx serve -s build
```

## Next Steps

- Add more expenses and explore filtering/sorting
- Check the README.md for detailed documentation
- Review the code structure
- Contribute improvements!

## Need Help?

- Check the main README.md for detailed info
- Review the API documentation in README.md
- Open an issue on GitHub
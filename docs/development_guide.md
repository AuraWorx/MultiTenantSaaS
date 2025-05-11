# Development Guide for AI Governance Platform

This guide provides detailed instructions for setting up and developing the AI Governance Platform on your local environment, specifically for Ubuntu 24.04.

## Local Development Setup

### Prerequisites

- **Node.js 20.x**: Required for running the JavaScript application
- **PostgreSQL 14.x or higher**: Required for the database
- **Git**: For version control

### Installing Prerequisites on Ubuntu 24.04

#### Install Node.js 20.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x or higher
```

#### Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version  # Should show PostgreSQL 14.x or higher
```

#### Setup PostgreSQL

```bash
# Create a new PostgreSQL user
sudo -u postgres createuser --interactive
# Enter name of role to add: your_username
# Shall the new role be a superuser? (y/n): y

# Create a new database
sudo -u postgres createdb ai_governance

# Set password for your user
sudo -u postgres psql
postgres=# ALTER USER your_username WITH PASSWORD 'your_password';
postgres=# \q
```

### Clone and Setup the Project

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ai-governance-platform.git
cd ai-governance-platform
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```bash
# In the project root directory
cat > .env << EOF
# Database
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/ai_governance

# Session
SESSION_SECRET=a_very_long_and_random_string_for_security
EOF
```

4. Initialize the database:

```bash
# Push the schema to the database
npm run db:push
```

5. Seed the database (optional):

```bash
# Optional: Seed initial data
npm run db:seed
```

## Running the Application

### Development Mode

```bash
# Start the development server
npm run dev
```

This will start the application in development mode. The server will be available at http://localhost:5000.

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Development Workflow

### Code Organization

- **Frontend**: All frontend code is in the `client/` directory
- **Backend**: All backend code is in the `server/` directory
- **Shared**: Shared code (schemas, types) is in the `shared/` directory

### Adding a New Feature

1. **Define Database Models**: Add necessary tables to `shared/schema.ts`
2. **Update the Backend**:
   - Add the storage operations in `server/storage.ts`
   - Add API routes in `server/routes.ts`
3. **Create Frontend Components**:
   - Create UI components in `client/src/components/`
   - Add page components in `client/src/pages/`
   - Update routes in `client/src/App.tsx`

### Debugging

- **Backend Logging**: Use `console.log()` for server-side debugging
- **Frontend Debugging**: Use the browser's developer tools
- **Database Queries**: Log database queries by enabling logging in `server/db.ts`

## Testing

### Manual Testing

Test all features through the UI, ensuring they work as expected across different user roles and organizations.

### API Testing

Use tools like Postman or curl to test API endpoints directly.

Example curl command to test the authentication API:

```bash
# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo_user","password":"demopassword"}' \
  --cookie-jar cookies.txt

# Get current user
curl -X GET http://localhost:5000/api/user \
  --cookie cookies.txt
```

## Deployment

### Preparing for Deployment

1. Update environment variables for production
2. Build the frontend assets
3. Test the application with production settings

### Deployment Options

#### Self-Hosted

1. Set up a production-ready PostgreSQL database
2. Configure Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Set up SSL with Let's Encrypt
4. Use PM2 to manage the Node.js process:

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start npm --name "ai-governance" -- start

# Ensure PM2 starts on system boot
pm2 startup
pm2 save
```

#### Cloud Platforms

The application can also be deployed to cloud platforms:

- **AWS**: Use Elastic Beanstalk or EC2
- **Google Cloud**: Use App Engine or Cloud Run
- **Azure**: Use App Service
- **Heroku**: Use the Node.js buildpack

## Common Issues and Solutions

### Database Connection Issues

If you encounter database connection problems:

1. Verify PostgreSQL is running: `sudo systemctl status postgresql`
2. Check the database URL in `.env`
3. Ensure the database user has proper permissions

### Node.js Memory Issues

If the application crashes with memory errors:

1. Increase Node.js memory limit: `NODE_OPTIONS=--max_old_space_size=4096 npm run dev`
2. Optimize memory-intensive operations
3. Consider adding pagination to large data fetches

### Authentication Issues

If users can't log in:

1. Check for correct credentials
2. Verify session configuration in `server/auth.ts`
3. Ensure cookies are being properly set and sent

## Best Practices

### Code Style

- Follow the established code style (TypeScript standard)
- Use meaningful variable and function names
- Add comments for complex logic

### Security

- Never commit sensitive information (API keys, passwords)
- Validate all user inputs
- Follow the principle of least privilege for database operations
- Use parameterized queries to prevent SQL injection

### Performance

- Optimize database queries with proper indexes
- Implement caching for frequently accessed data
- Use pagination for large data sets
- Minimize the size of API responses

## Contributing

1. Create a new branch for each feature or bugfix
2. Submit pull requests with detailed descriptions
3. Ensure all code passes linting and type checks
4. Update documentation as needed

---

For more information, refer to the main [README.md](../README.md).
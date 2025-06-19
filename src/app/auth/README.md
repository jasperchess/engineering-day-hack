# Authentication Setup

This directory contains the complete authentication system for the Engineering Day application using Better Auth with Drizzle ORM and SQLite.

## Overview

The authentication system provides:
- Email/password authentication
- Social authentication (GitHub, Google)
- Session management
- Route protection
- User profile management

## File Structure

```
src/app/auth/
├── README.md              # This file
├── index.ts              # Main exports
├── auth.ts               # Better Auth configuration
├── client.ts             # Client-side auth utilities
├── db.ts                 # Database connection
├── schema.ts             # Drizzle schema definitions
├── setup.ts              # Database setup script
├── middleware.ts         # Authentication middleware
├── components/           # React components
│   ├── LoginForm.tsx
│   ├── SignUpForm.tsx
│   ├── UserProfile.tsx
│   └── Navigation.tsx
└── hooks/
    └── useAuth.ts        # Authentication hook
```

## Setup Instructions

### 1. Install Dependencies

The required dependencies are already added to `package.json`:
- `better-auth`: Authentication library
- `drizzle-orm`: ORM for database operations
- `drizzle-kit`: Database toolkit
- `better-sqlite3`: SQLite driver

Run `npm install` to install all dependencies.

### 2. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
BETTER_AUTH_SECRET="your-super-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional - for social auth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Database Setup

The database will be automatically set up when you first run the application in development mode. Alternatively, you can manually run the setup:

```bash
# Generate database migrations
npm run db:generate

# Push changes to database
npm run db:push

# View database in Drizzle Studio
npm run db:studio
```

### 4. Social Authentication Setup (Optional)

#### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/api/auth/callback/github`
4. Add the Client ID and Secret to your environment variables

#### Google OAuth
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set redirect URI to: `http://localhost:3000/api/auth/callback/google`
6. Add the Client ID and Secret to your environment variables

## Usage

### Client-Side Authentication

```tsx
import { useAuth } from '@/app/auth';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Server-Side Authentication

```tsx
import { getServerSession } from '@/app/auth/middleware';

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
}
```

### Protecting API Routes

```tsx
import { withAuth } from '@/app/auth/middleware';

export const GET = withAuth(async (request, session) => {
  // This handler only runs for authenticated users
  return NextResponse.json({ 
    message: 'Hello authenticated user!',
    user: session.user 
  });
});
```

## Components

### LoginForm
Handles email/password and social authentication sign-in.

### SignUpForm
Handles user registration with email/password.

### UserProfile
Displays user information and sign-out functionality.

### Navigation
Main navigation component with authentication-aware links.

## Database Schema

The authentication system uses the following tables:

- `user`: User account information
- `session`: Active user sessions
- `account`: OAuth provider accounts
- `verification`: Email verification tokens
- `files`: File metadata (for file upload feature)

## Security Features

- Secure session management
- CSRF protection
- Password hashing
- SQL injection prevention
- Rate limiting (configurable)

## Customization

You can customize the authentication behavior by modifying:

- `auth.ts`: Authentication configuration
- `schema.ts`: Database schema
- Components: UI customization
- `middleware.ts`: Route protection logic

## Troubleshooting

### Common Issues

1. **Database not found**: Ensure the database setup script runs successfully
2. **OAuth not working**: Verify environment variables and callback URLs
3. **Session not persisting**: Check BETTER_AUTH_SECRET is set correctly
4. **CORS issues**: Ensure BETTER_AUTH_URL matches your domain

### Debug Mode

Set `NODE_ENV=development` to enable debug logging and automatic database setup.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `BETTER_AUTH_SECRET` (32+ characters)
3. Configure proper database backups
4. Set up HTTPS for all authentication endpoints
5. Review and test all OAuth callback URLs
# Authentication & Favorites System - Setup Guide

## Deployment Status

**Application URL**: https://6a9unlnsp8oa.space.minimax.io
**Status**: Frontend Complete - Database Setup Pending

## What's Implemented

### 1. Authentication System
- Email/password registration and login
- Session persistence (auto-login for returning users)
- User profile management
- Sign out functionality

### 2. UI Components
- **Sign In Button**: Top right corner (when not logged in)
- **User Profile Dropdown**: Shows user info and favorites access
- **Auth Modal**: Beautiful login/register form with validation
- **Favorites Dashboard**: Grid view of saved items

### 3. Favorites Management
- **Heart Icons**: On every news/event card
- **Add to Favorites**: Click heart icon (requires login)
- **Remove from Favorites**: Click filled heart or use dashboard
- **View Favorites**: Access via user profile dropdown
- **Optimistic Updates**: Instant UI feedback

### 4. Security Features
- Row Level Security (RLS) policies ready
- User-specific data isolation
- Protected routes for favorites
- Secure authentication flow

## Database Setup Required

The application frontend is complete, but database tables need to be created. 

### SQL Migration File Location
`/workspace/geopolitical-analysis/database_setup.sql`

### Tables to Create

#### 1. user_profiles
- Stores user display names and preferences
- Linked to Supabase Auth users
- RLS enabled for security

#### 2. user_favorites
- Stores favorited news/events per user
- JSONB data for full event information
- Indexed for fast queries
- RLS enabled (users can only see their own)

### RLS Policies Included
- Users can view/update their own profile
- Users can view/insert/delete their own favorites
- All operations validated against `auth.uid()`

## Setup Instructions

### Step 1: Refresh Supabase Token
The current Supabase access token has expired. Request token refresh from coordinator.

### Step 2: Create Database Tables
Once token is refreshed, execute the SQL migration:

```bash
# Option A: Using apply_migration tool
apply_migration(
  name="create_auth_and_favorites_tables",
  query=<content from database_setup.sql>
)

# Option B: Using Supabase Dashboard
1. Go to Supabase project dashboard
2. Navigate to SQL Editor
3. Paste contents of database_setup.sql
4. Execute query
```

### Step 3: Verify Tables Created
```sql
SELECT * FROM user_profiles LIMIT 1;
SELECT * FROM user_favorites LIMIT 1;
```

### Step 4: Test Authentication Flow
1. Visit: https://6a9unlnsp8oa.space.minimax.io
2. Click "Sign In" button (top right)
3. Register a new account
4. Check email for confirmation (if email confirmation enabled)
5. Sign in with credentials
6. Verify user profile dropdown appears

### Step 5: Test Favorites
1. While logged in, click heart icon on any news card
2. Verify heart fills (becomes red)
3. Click user profile → "My Favorites"
4. Verify saved item appears in dashboard
5. Click trash icon to remove favorite
6. Verify item removed

## Features Summary

### For Anonymous Users
- Browse news and events
- View AI assessments
- Search and filter
- Cannot save favorites (prompts to sign in)

### For Authenticated Users
- All anonymous features
- Save/unsave favorites
- View favorites dashboard
- Persistent favorites across sessions
- Profile management

## Technical Details

### Authentication Context
- Location: `/src/contexts/AuthContext.tsx`
- Provides: user, loading, signIn, signUp, signOut, updateProfile
- Follows Supabase best practices (no async in auth callbacks)

### Favorites Context
- Location: `/src/contexts/FavoritesContext.tsx`
- Provides: favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite
- Optimistic updates for smooth UX

### Components
- **AuthModal**: `/src/components/AuthModal.tsx` - Login/Register form
- **UserProfile**: `/src/components/UserProfile.tsx` - Profile dropdown
- **FavoritesDashboard**: `/src/components/FavoritesDashboard.tsx` - Saved items viewer

### Integration Points
- `App.tsx`: Wraps with auth/favorites contexts
- `main.tsx`: Providers setup
- `LiveSignalsFeed.tsx`: Heart icons on EventCard
- All components respect auth state

## Bundle Size
- JavaScript: 670.55 KB (gzipped: 149.34 KB)
- CSS: 37.76 KB (gzipped: 7.46 KB)
- Includes Supabase client and auth

## Security Notes
- RLS policies enforce user data isolation
- All favorites queries filtered by user_id
- Auth state validated on every request
- Secure session management via Supabase

## Known Limitations
- Database tables not yet created (pending token refresh)
- Favorites will show empty until tables exist
- Email confirmation depends on Supabase project settings

## Next Actions Required
1. **IMMEDIATE**: Refresh Supabase access token
2. **IMMEDIATE**: Execute database_setup.sql
3. **TEST**: Authentication flow
4. **TEST**: Favorites functionality
5. **VERIFY**: RLS policies working correctly

## Support
If you encounter issues:
1. Check browser console for errors
2. Verify Supabase project is active
3. Confirm database tables exist
4. Check RLS policies are enabled
5. Verify auth.uid() returns correct user ID

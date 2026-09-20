# End-to-End Testing Plan - Authentication & Favorites System

## Updated Deployment
**New URL with Enhanced Error Handling**: https://kp8sc44ktv73.space.minimax.io
**Status**: Frontend Complete with Robust Error Handling

## Testing Scope

This document outlines comprehensive end-to-end testing for the authentication and favorites system.

## Pre-Testing Checklist

### Database Setup (CRITICAL)
- [ ] Supabase access token refreshed
- [ ] Tables created: `user_profiles`, `user_favorites`
- [ ] RLS policies enabled and tested
- [ ] Indexes created for performance

### Verify SQL Execution
```sql
-- Test table existence
SELECT * FROM user_profiles LIMIT 1;
SELECT * FROM user_favorites LIMIT 1;

-- Test RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('user_profiles', 'user_favorites');
```

## Test Scenarios

### 1. User Registration Flow

**Test Steps:**
1. Visit https://kp8sc44ktv73.space.minimax.io
2. Click "Sign In" button (top-right)
3. Click "Sign up" link at bottom of modal
4. Fill in registration form:
   - Display Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "Test123456"
5. Click "Create Account"

**Expected Results:**
- ✅ Success message appears
- ✅ Modal closes automatically
- ✅ User profile appears in top-right (replacing Sign In button)
- ✅ User profile shows "Test User" name
- ✅ Record created in `user_profiles` table
- ✅ User can access favorites feature

**Error Handling Tests:**
- Enter invalid email → Shows error message
- Enter short password (<6 chars) → Shows validation error
- Try duplicate email → Shows "User already exists" error
- Network error → Shows user-friendly error message

### 2. User Sign In Flow

**Test Steps:**
1. Sign out if logged in (User Profile → Sign Out)
2. Click "Sign In" button
3. Enter credentials:
   - Email: "testuser@example.com"
   - Password: "Test123456"
4. Click "Sign In"

**Expected Results:**
- ✅ Success (no error message)
- ✅ Modal closes
- ✅ User profile appears in top-right
- ✅ Session persists (refresh page, still logged in)

**Error Handling Tests:**
- Wrong password → "Invalid credentials" error
- Non-existent email → "Invalid credentials" error
- Empty fields → Field validation errors
- Network error → User-friendly error message

### 3. Session Persistence Test

**Test Steps:**
1. Sign in successfully
2. Close browser completely
3. Re-open browser
4. Visit application URL

**Expected Results:**
- ✅ User automatically logged in
- ✅ User profile visible without sign-in
- ✅ Can access favorites immediately

### 4. Add Favorite Flow

**Test Steps:**
1. Ensure signed in
2. Find a news card in Live Signals panel
3. Click heart icon (unfilled)
4. Wait for animation

**Expected Results:**
- ✅ Heart immediately fills (red color)
- ✅ Toast notification: "Added to favorites"
- ✅ Record inserted in `user_favorites` table
- ✅ Data persists after page refresh

**Error Handling Tests:**
- Database error → Heart reverts to unfilled, error toast shown
- Network error → Heart reverts, retry prompt shown
- Click again while saving → No duplicate entries

### 5. Remove Favorite Flow (Method 1: Heart Icon)

**Test Steps:**
1. Find a favorited item (filled red heart)
2. Click the heart icon
3. Observe changes

**Expected Results:**
- ✅ Heart immediately unfills
- ✅ Toast notification: "Removed from favorites"
- ✅ Record deleted from `user_favorites` table
- ✅ Persists after refresh

**Error Handling Tests:**
- Database error → Heart reverts to filled, error toast
- Network error → Retry prompt

### 6. View Favorites Dashboard

**Test Steps:**
1. Add 3-5 favorites
2. Click user profile dropdown (top-right)
3. Click "My Favorites"
4. Review dashboard

**Expected Results:**
- ✅ Modal opens with all favorited items
- ✅ Shows count: "X saved items"
- ✅ Items display with full details:
  - Title
  - Description
  - Location, timestamp
  - Sentiment and priority badges
  - Category
- ✅ Items sorted by creation date (newest first)
- ✅ Click item → Opens in AI Assessment panel

**Error Handling Tests:**
- Empty favorites → "No favorites yet" message
- Load error → Error message with retry option

### 7. Remove Favorite Flow (Method 2: Dashboard)

**Test Steps:**
1. Open favorites dashboard
2. Find a favorite item
3. Click trash icon (right side)
4. Observe changes

**Expected Results:**
- ✅ Item immediately disappears from list
- ✅ Count updates ("4 saved items" → "3 saved items")
- ✅ Record deleted from database
- ✅ Heart unfills on main feed

**Error Handling Tests:**
- Delete error → Item reappears, error toast
- Network error → Retry prompt

### 8. Anonymous User Experience

**Test Steps:**
1. Sign out completely
2. Click heart icon on any news card
3. Observe response

**Expected Results:**
- ✅ Toast shows: "Please sign in to save favorites"
- ✅ Toast has "Sign In" action button
- ✅ Clicking action button opens auth modal
- ✅ No database operation attempted

### 9. Multiple Users Isolation (RLS Test)

**Test Steps:**
1. User A: Sign in, add 3 favorites
2. User A: Sign out
3. User B: Sign in (different account)
4. User B: Check favorites dashboard

**Expected Results:**
- ✅ User B sees empty favorites (not User A's)
- ✅ User B adds favorites → Only visible to User B
- ✅ Database query filtered by `user_id`
- ✅ RLS policies enforce isolation

**Security Tests:**
- Try SQL injection in favorite data → Blocked
- Try accessing other user's favorites via API → Denied
- Verify RLS policies active: `auth.uid() = user_id`

### 10. Sign Out Flow

**Test Steps:**
1. While logged in, click user profile dropdown
2. Click "Sign Out"
3. Observe changes

**Expected Results:**
- ✅ User profile disappears
- ✅ "Sign In" button reappears
- ✅ Heart icons still visible but require auth
- ✅ Session cleared from browser
- ✅ Refresh page → Still signed out

### 11. Concurrent Operations Test

**Test Steps:**
1. Quickly add 5 favorites in succession (rapid clicking)
2. Check favorites dashboard
3. Verify database records

**Expected Results:**
- ✅ All 5 favorites saved
- ✅ No duplicate entries
- ✅ Optimistic UI stays synced
- ✅ No race conditions

### 12. Network Failure Simulation

**Test Steps:**
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Try to add favorite
4. Observe error handling

**Expected Results:**
- ✅ Operation fails gracefully
- ✅ Error toast: "Failed to update favorites"
- ✅ Suggests retry and sign-in check
- ✅ UI reverts to previous state
- ✅ No orphaned data

### 13. Large Dataset Test

**Test Steps:**
1. Add 50+ favorites
2. Open favorites dashboard
3. Scroll through list
4. Test performance

**Expected Results:**
- ✅ Dashboard loads quickly (<2s)
- ✅ Smooth scrolling
- ✅ All items render correctly
- ✅ No memory leaks

### 14. Cross-Browser Testing

**Browsers to Test:**
- Chrome/Edge (Chromium)
- Firefox
- Safari (macOS/iOS)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Expected Results:**
- ✅ All features work consistently
- ✅ UI displays correctly
- ✅ Auth flows work
- ✅ Favorites persist

### 15. Mobile Responsiveness

**Test Steps:**
1. Open on mobile device or use DevTools
2. Test all auth flows
3. Test favorites functionality
4. Check UI layout

**Expected Results:**
- ✅ Auth modal fits screen
- ✅ Heart icons easily tappable
- ✅ Dashboard readable and usable
- ✅ No horizontal scrolling
- ✅ Dropdowns work correctly

## Performance Benchmarks

### Target Metrics
- Page load: <3s
- Sign in: <1s
- Add favorite: <500ms (perceived instant)
- Load favorites: <1s
- Dashboard open: <500ms

### Database Query Performance
- User favorites query: <100ms
- Insert favorite: <50ms
- Delete favorite: <50ms

## Security Checklist

- [ ] RLS policies active on both tables
- [ ] User can only see their own data
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] CSRF protection via Supabase
- [ ] Secure password storage (Supabase handles)
- [ ] Session tokens secure (httpOnly, secure flags)

## Known Limitations & Workarounds

1. **Database Not Created Yet**
   - **Issue**: Tables don't exist (token expired)
   - **Workaround**: Refresh token, run SQL migration
   - **Impact**: Favorites won't persist until tables exist

2. **Email Verification**
   - **Depends**: Supabase project settings
   - **If enabled**: Users must verify email before login
   - **If disabled**: Immediate access

3. **Password Reset**
   - **Status**: Not implemented
   - **Workaround**: Use Supabase dashboard
   - **Future**: Can add "Forgot password" link

## Testing Tools

### Required
- Browser (Chrome recommended)
- Browser DevTools
- Supabase Dashboard access

### Optional
- Postman (API testing)
- Lighthouse (performance)
- WAVE (accessibility)

## Bug Reporting Template

```markdown
**Bug Title**: [Brief description]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**: [What should happen]

**Actual Behavior**: [What actually happened]

**Screenshots**: [If applicable]

**Environment**:
- Browser: [Chrome 120, etc.]
- Device: [Desktop, Mobile]
- OS: [Windows, macOS, iOS, Android]

**Console Errors**: [Copy from DevTools]

**Severity**: [Critical/High/Medium/Low]
```

## Success Criteria

The system passes all tests when:
- ✅ All 15 test scenarios pass
- ✅ Error handling works correctly
- ✅ No data loss during errors
- ✅ RLS policies enforce isolation
- ✅ Performance meets benchmarks
- ✅ Works across all browsers
- ✅ Mobile experience smooth

## Next Steps After Testing

1. Document all bugs found
2. Prioritize: Critical → High → Medium → Low
3. Fix all critical and high priority bugs
4. Re-test affected scenarios
5. Deploy final version
6. Monitor production for issues

## Contact & Support

For questions or issues:
- Check: `/workspace/geopolitical-analysis/AUTH_SETUP_GUIDE.md`
- SQL Migration: `/workspace/geopolitical-analysis/database_setup.sql`
- Error Logs: Browser DevTools Console

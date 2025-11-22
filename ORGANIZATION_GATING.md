# Organization-Gated Access

Your application now requires users to be part of an organization before they can access any features!

## 🔒 How It Works

### New User Flow

1. **Sign Up** (`/sign-up`)
   - User creates account with email/password
   - Automatically redirected to `/create-organization`

2. **Create Organization** (`/create-organization`)
   - User must create or join an organization
   - Organization becomes their "active organization"
   - User is set as the "owner" role

3. **Access Application** (`/`)
   - User can now access the main application
   - Sidebar shows the active organization name
   - All features are now available

### Existing User Flow

1. **Sign In** (`/sign-in`)
   - User logs in with credentials

2. **Organization Check** (Automatic)
   - If user has an active organization → redirected to home
   - If user has NO organization → redirected to `/create-organization`

3. **Access Application** (`/`)
   - User can access the app with their organization

## 🛡️ Protection Layers

### 1. **Client-Side Protection** (`src/app/page.js`)

```javascript
// Check if user has an active organization
useEffect(() => {
  if (session && !isOrgLoading && !activeOrg) {
    // User is authenticated but has no active organization
    router.push("/create-organization");
  }
}, [session, activeOrg, isOrgLoading, router]);
```

- Checks for active organization on home page
- Redirects to create-organization if none exists
- Shows loading skeleton while checking

### 2. **Middleware Protection** (`middleware.js`)

```javascript
const isCreateOrgPage = request.nextUrl.pathname.startsWith("/create-organization");

// Allow authenticated users to access create-organization
if (!sessionCookie && !isAuthPage && !isCreateOrgPage) {
  return NextResponse.redirect(signInUrl);
}
```

- Ensures authentication for all routes
- Allows access to `/create-organization` for authenticated users
- Blocks unauthenticated access

### 3. **Organization Management** (`/dashboard/organization`)

- Shows "Create Organization" button if no active org
- Allows users to manage their organization
- View/invite/remove members

## 📋 Access Control Summary

| Route | Authentication Required | Organization Required | Notes |
|-------|------------------------|----------------------|-------|
| `/sign-in` | ❌ No | ❌ No | Public auth page |
| `/sign-up` | ❌ No | ❌ No | Public auth page |
| `/create-organization` | ✅ Yes | ❌ No | For new users |
| `/` (Home) | ✅ Yes | ✅ Yes | Main app |
| `/dashboard/organization` | ✅ Yes | ⚠️ Shows prompt | Management page |
| `/account` | ✅ Yes | ⚠️ Optional | User settings |

## 🔄 User States

### State 1: Not Authenticated
- **Can access**: `/sign-in`, `/sign-up`
- **Cannot access**: Everything else
- **Redirected to**: `/sign-in`

### State 2: Authenticated, No Organization
- **Can access**: `/create-organization`, auth pages
- **Cannot access**: Main app, dashboard
- **Redirected to**: `/create-organization`

### State 3: Authenticated, Has Organization
- **Can access**: Everything
- **Full access to**: Main app, dashboard, organization management

## 🎯 What This Prevents

✅ **Prevents users from seeing the app without an organization**
- No boards visible
- No sidebar access
- No organization-specific features

✅ **Forces organization creation for new users**
- Automatic redirect after signup
- Cannot bypass by navigating directly

✅ **Handles edge cases**
- Users who leave all organizations
- Users invited but not accepted
- Session expiration

## 🔧 Customization Options

### Allow Users Without Organizations

If you want to allow limited access without an organization, update `src/app/page.js`:

```javascript
// Remove or comment out this redirect
// useEffect(() => {
//   if (session && !isOrgLoading && !activeOrg) {
//     router.push("/create-organization");
//   }
// }, [session, activeOrg, isOrgLoading, router]);
```

### Change Default Redirect

Update the redirect destination in `src/app/(auth)/sign-up/page.jsx`:

```javascript
// Change from:
router.push("/create-organization");

// To:
router.push("/onboarding"); // or any other page
```

### Add Organization Switcher

To allow users to switch between multiple organizations:

```javascript
const { data: organizations } = authClient.useListOrganizations();

// Then in your UI:
<Select
  value={activeOrg?.id}
  onValueChange={(orgId) => {
    authClient.organization.setActive({ organizationId: orgId });
  }}
>
  {organizations?.map(org => (
    <SelectItem key={org.id} value={org.id}>
      {org.name}
    </SelectItem>
  ))}
</Select>
```

## 🐛 Troubleshooting

### User stuck in redirect loop
- Check if organization was created successfully
- Verify database has the organization and member records
- Clear browser cache and cookies

### Can't access create-organization page
- Ensure middleware allows `/create-organization`
- Check authentication cookie is set
- Verify user is logged in

### Organization not showing in sidebar
- Check `useActiveOrganization` hook is returning data
- Verify session includes `activeOrganizationId`
- Ensure database query is successful

## 📚 Related Files

- `src/app/page.js` - Home page with org check
- `middleware.js` - Route protection
- `src/app/(auth)/sign-up/page.jsx` - Signup redirect
- `src/app/create-organization/page.jsx` - Org creation
- `src/app/dashboard/organization/page.jsx` - Org management

## ✨ Benefits

1. **Better Multi-tenancy**: Each organization is isolated
2. **Clearer Onboarding**: Users must set up their workspace first
3. **Enhanced Security**: No access without proper organization context
4. **Team Collaboration**: Forces team-based structure from the start
5. **Data Isolation**: All data scoped to organizations

Your application is now fully organization-gated! 🎉


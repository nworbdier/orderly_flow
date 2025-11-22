# 🚀 Quick Start - Better Auth with Organizations

## ⚡ Get Started in 3 Steps

### 1. Push Database Schema

```bash
bunx drizzle-kit push
```

This creates all organization tables in your PostgreSQL database.

### 2. Start Development Server

```bash
bun dev
```

### 3. Create Your Organization

1. Visit `http://localhost:3000/sign-up`
2. Create your account
3. Go to `/create-organization`
4. Enter organization name (slug auto-generates)
5. Click "Create Organization"

## ✅ What's Working Now

- ✅ **Authentication** - Email/password with Better Auth
- ✅ **Organizations** - Multi-tenant organization support
- ✅ **Member Management** - Invite, remove, and manage team members
- ✅ **Role-Based Access** - Owner, Admin, Member roles
- ✅ **Sidebar Integration** - Shows active organization
- ✅ **Database Storage** - PostgreSQL with Drizzle ORM
- ✅ **Session Management** - Secure cookie-based sessions

## 📍 Key Pages

- `/sign-up` - Create account
- `/sign-in` - Sign in
- `/create-organization` - Create new organization
- `/dashboard/organization` - Manage organization & members
- `/account` - User profile settings

## 🔑 Default Roles

| Role       | Permissions                           |
| ---------- | ------------------------------------- |
| **Owner**  | Full control, can delete organization |
| **Admin**  | Manage members, update settings       |
| **Member** | View organization, limited actions    |

## 📋 Next Steps

1. **Configure Email** (optional)

   - Update `sendInvitationEmail` in `src/lib/auth.js`
   - Add email service (SendGrid, Resend, etc.)

2. **Customize Permissions** (optional)

   - Create custom roles in `src/lib/permissions.js`
   - Add resource-specific permissions

3. **Enable Teams** (optional)
   - Add teams support to organization plugin
   - Create team management UI

## 🆘 Need Help?

- Check `ORGANIZATION_SETUP.md` for detailed documentation
- See `BETTER_AUTH_SETUP.md` for auth configuration
- Visit [Better Auth Docs](https://www.better-auth.com/docs/plugins/organization)

## 🎯 Current Limitations

- **Email Invitations**: Currently logged to console (needs email service)
- **Board Storage**: Still using localStorage (needs migration to DB)
- **Teams**: Not enabled (can be added)

These are ready to implement next!

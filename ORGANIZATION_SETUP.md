# Organization Setup Guide

Better Auth with Organizations has been successfully integrated into Orderly Flow!

## 🎉 What's Been Set Up

### 1. **Database Schema**

All organization-related tables have been added to your PostgreSQL database via Drizzle:

- `organization` - Organization details (name, slug, logo, metadata)
- `member` - Organization members and their roles
- `invitation` - Pending invitations to join organizations
- `board` - Project boards (connected to organizations)
- `board_group` - Groups within boards
- `board_item` - Items within groups

### 2. **Authentication with Organizations**

- **Server**: Better Auth configured with organization plugin (`src/lib/auth.js`)
- **Client**: Organization client plugin added (`src/lib/auth-client.js`)
- **Session**: Active organization tracking in user sessions

### 3. **UI Components**

#### Sidebar

- Shows current active organization name
- User dropdown menu with organization link
- Real-time updates when organization changes

#### Organization Management Page (`/dashboard/organization`)

- View organization details
- Invite team members with roles (member/admin)
- Manage members (view, remove)
- View and cancel pending invitations

#### Create Organization Page (`/create-organization`)

- Beautiful onboarding flow
- Auto-generates slug from organization name
- Sets newly created org as active

## 🚀 Next Steps

### 1. Push Database Schema

Run these commands to apply the schema to your PostgreSQL database:

```bash
bunx drizzle-kit push
```

This will create all the necessary tables in your Railway PostgreSQL database.

### 2. Create Your First Organization

After starting the dev server:

1. Visit `http://localhost:3000/sign-up` to create an account
2. After signing in, you'll see a prompt to create an organization
3. Go to `/create-organization` to set up your first organization
4. You'll automatically become the owner with full permissions

### 3. Invite Team Members

Once you have an organization:

1. Click your user avatar in the sidebar
2. Select "Organization" from the dropdown
3. Click "Invite Member"
4. Enter email and select role (member/admin/owner)
5. Invitation link will be logged to console (until email is configured)

## 👥 Roles & Permissions

### Default Roles

- **Owner**: Full control, can delete organization, manage all members
- **Admin**: Can manage members, invitations, and organization settings (cannot delete org)
- **Member**: Can view organization, limited management capabilities

### Permissions

The default access control includes:

- **Organization**: `update`, `delete`
- **Member**: `create`, `update`, `delete`
- **Invitation**: `create`, `cancel`

## 📧 Email Configuration (TODO)

Currently, invitation emails are logged to the console. To send actual emails:

1. Choose an email service (SendGrid, Resend, AWS SES, etc.)
2. Update `sendInvitationEmail` in `src/lib/auth.js`
3. Example:

```javascript
organization({
  sendInvitationEmail: async (data) => {
    await sendEmail({
      to: data.email,
      subject: `You're invited to join ${data.organization.name}`,
      html: `
        <p>${data.inviter.user.name} invited you to join ${data.organization.name}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}">
          Accept Invitation
        </a>
      `,
    });
  },
});
```

## 🔐 Security Features

- **Email verification**: Can be required for invitations
- **Role-based access control**: Granular permissions system
- **Invitation expiry**: Invitations expire after 48 hours (configurable)
- **Session-based auth**: Secure cookie handling with Better Auth

## 📊 Database Tables Overview

### Core Tables (Added)

```
organization
├── id (primary key)
├── name
├── slug (unique)
├── logo
├── metadata (jsonb)
├── createdAt
└── updatedAt

member
├── id (primary key)
├── organizationId (foreign key)
├── userId (foreign key)
├── role
└── createdAt

invitation
├── id (primary key)
├── organizationId (foreign key)
├── email
├── role
├── status
├── expiresAt
├── inviterId (foreign key)
├── createdAt
└── updatedAt
```

### Application Tables (Added)

```
board
├── id (primary key)
├── name
├── organizationId (foreign key)
├── columns (jsonb)
├── createdAt
└── updatedAt

board_group
├── id (primary key)
├── boardId (foreign key)
├── title
├── position
├── createdAt
└── updatedAt

board_item
├── id (primary key)
├── groupId (foreign key)
├── data (jsonb)
├── position
├── createdAt
└── updatedAt
```

## 🛠️ Customization

### Add Custom Roles

Create custom roles in `src/lib/permissions.js`:

```javascript
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  project: ["create", "update", "delete", "share"],
} as const;

const ac = createAccessControl(statement);

const customRole = ac.newRole({
  project: ["create", "update"],
  organization: ["update"],
});
```

### Add Organization Metadata

Organizations support metadata field (JSONB) for custom data:

```javascript
await authClient.organization.update({
  data: {
    metadata: {
      industry: "Technology",
      size: "10-50",
      plan: "pro",
    },
  },
});
```

## 🔄 Migrating from In-Memory Storage

Your app previously used localStorage for board data. Now:

1. ✅ Boards are stored in PostgreSQL
2. ✅ Connected to organizations
3. ✅ Multi-user collaborative by default
4. ✅ Persistent across devices

To migrate existing boards, you'll need to:

1. Create API routes to save/load boards
2. Update Board component to use API instead of localStorage
3. Associate boards with active organization

## 📝 API Usage Examples

### Check Permissions

```javascript
// Client-side
const hasPermission = await authClient.organization.hasPermission({
  permissions: {
    member: ["delete"],
  },
});

// Server-side
const hasPermission = await auth.api.hasPermission({
  headers: await headers(),
  body: {
    permissions: {
      member: ["delete"],
    },
  },
});
```

### List Organizations

```javascript
const { data: organizations } = authClient.useListOrganizations();
```

### Switch Active Organization

```javascript
await authClient.organization.setActive({
  organizationId: "org-id",
});
```

## 🐛 Troubleshooting

### "No active organization" error

- Make sure user created an organization
- Check if active organization is set in session
- Redirect to `/create-organization` if none exists

### Invitation not working

- Check console logs for invitation details
- Verify DATABASE_URL is set correctly
- Ensure email verification is disabled for testing

### Database connection errors

- Verify PostgreSQL connection string in `.env.local`
- Run `bunx drizzle-kit push` to apply schema
- Check Railway dashboard for database status

## 📚 Additional Resources

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Next.js App Router](https://nextjs.org/docs/app)

## ✨ Features to Add Next

1. **Team Management** - Enable teams within organizations
2. **Board Permissions** - Granular permissions per board
3. **Activity Log** - Track organization changes
4. **Billing Integration** - Add subscription management
5. **SSO** - Enterprise single sign-on
6. **Audit Logs** - Compliance and security tracking

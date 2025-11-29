# 🩸 Sri Lanka Blood Shortage Dashboard

A real-time public dashboard for tracking blood shortages across Sri Lanka, designed to help donors quickly find where their blood type is urgently needed during disaster situations.

## 📋 Overview

During disaster situations—like floods in Sri Lanka—mobile blood donation campaigns collapse, leading to severe national shortages. Currently, the National Blood Transfusion Service (NBTS) only publishes general alerts ("blood needed"), without providing centre-level details on where blood is urgently required.

This project fills that gap by building a real-time public dashboard, powered by official updates from blood banks and hospitals across the country.

## ✨ Features

- **Public Dashboard**: Real-time view of all blood shortages across Sri Lanka
- **Center Management**: Authorized blood bank officials can post and update shortages
- **Role-Based Access**: Admin and editor roles with appropriate permissions
- **Audit Logging**: Complete audit trail of all CRUD operations
- **Real-time Updates**: Live updates without page refresh using Supabase Realtime
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Search & Filters**: Filter by blood type, district, and urgency level

## 🏗️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Realtime)
- **Deployment**: Vercel (recommended)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account (free tier works)
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd blood-shortage
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_audit_triggers.sql`
4. (Optional) Run `supabase/seed.sql` to add sample centers

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find these values in your Supabase project settings under **API**.

### 5. Set Up Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates if needed
4. Set up email verification (optional for development)

### 6. Create User Accounts

User accounts must be created through Supabase Auth, then linked to centers via the `user_centers` table:

```sql
-- Example: Link a user to a center
INSERT INTO user_centers (user_id, center_id, role)
VALUES (
  'user-uuid-from-auth-users',
  'center-uuid',
  'admin' -- or 'editor'
);
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
blood-shortage/
├── app/
│   ├── (auth)/              # Authentication routes
│   │   └── login/
│   ├── (public)/            # Public dashboard
│   │   └── page.tsx
│   ├── dashboard/           # Authenticated dashboard
│   │   ├── page.tsx
│   │   └── audit/           # Audit log viewer
│   ├── actions/            # Server actions
│   │   ├── auth.ts
│   │   ├── shortages.ts
│   │   └── audit.ts
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── shortage-card.tsx
│   ├── shortage-form.tsx
│   ├── shortage-list.tsx
│   ├── shortage-filter.tsx
│   └── search-bar.tsx
├── lib/
│   ├── supabase/            # Supabase clients
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   └── utils.ts
├── supabase/
│   ├── migrations/          # Database migrations
│   └── seed.sql             # Sample data
└── middleware.ts            # Auth middleware
```

## 🔒 Security Features

- **Row-Level Security (RLS)**: All tables have RLS policies
  - Public can read `shortages` and `centers`
  - Users can only create/update shortages for their own center
  - Only admins can delete shortages
  - Audit logs are read-only for admins

- **Server-Side Validation**: All form inputs validated server-side
- **Secure Sessions**: Managed by Supabase Auth
- **Immutable Audit Logs**: Audit logs cannot be modified or deleted

## 🗄️ Database Schema

### Tables

- **centers**: Blood donation centers
- **user_centers**: Links users to centers with roles
- **shortages**: Blood shortage entries
- **audit_logs**: Audit trail of all changes

### Enums

- `blood_status`: critical, low, normal
- `audit_action`: create, update, delete
- `user_role`: admin, editor

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin operations)

## 📝 Usage

### For Blood Bank Officials

1. Log in at `/login` with your credentials
2. View your center's current shortages
3. Create new shortage entries
4. Update existing shortages
5. Delete resolved shortages (admin only)
6. View audit logs (admin only)

### For Public Users

1. Visit the public dashboard at `/`
2. Browse all current shortages
3. Filter by blood type, district, or status
4. Search by location or center name
5. Contact centers directly using provided phone numbers

## 🔧 Development

### Type Generation

If you modify the database schema, update the types in `lib/supabase/types.ts` or use Supabase CLI to generate types:

```bash
npx supabase gen types typescript --project-id your-project-id > lib/supabase/types.ts
```

### Running Migrations

Migrations should be run in the Supabase SQL Editor in order:
1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_audit_triggers.sql`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available for use by the National Blood Transfusion Service and authorized blood banks in Sri Lanka.

## 🆘 Support

For issues or questions, please contact the project maintainers or open an issue in the repository.

## 🙏 Acknowledgments

Built for the National Blood Transfusion Service (NBTS) of Sri Lanka to help save lives during disaster situations.

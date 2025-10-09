# Familie Todo App

En React Native-applikation för familjeuppgifter och belöningar, byggd med Expo och Supabase.

## Funktioner

- **Användarautentisering** - Registrering och inloggning
- **Familjehantering** - Skapa familjer och bjud in medlemmar
- **Uppgiftshantering** - Skapa, tilldela och slutför uppgifter
- **Poängsystem** - Tjäna poäng för slutförda uppgifter
- **Belöningar** - Köp belöningar med intjänade poäng
- **Notifieringar** - Få notiser om nya uppgifter och aktiviteter

## Teknisk Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Språk**: TypeScript
- **UI**: React Native Elements + React Native Paper

## Installation

### Förutsättningar

- Node.js (v16 eller senare)
- npm eller yarn
- Expo CLI
- Supabase-konto

### Steg-för-steg Installation

1. **Klona projektet** (om det inte redan finns):

   ```bash
   cd family-todo-app
   ```

2. **Installera dependencies**:

   ```bash
   npm install
   ```

3. **Konfigurera Supabase**:

   - Skapa ett nytt projekt på [supabase.com](https://supabase.com)
   - Uppdatera `src/services/supabase.ts` med dina Supabase-uppgifter:

   ```typescript
   const supabaseUrl = "DIN_SUPABASE_URL";
   const supabaseAnonKey = "DIN_SUPABASE_ANON_KEY";
   ```

4. **Skapa databasschema**:

   - Gå till Supabase Dashboard → ditt projekt → SQL Editor
   - Öppna filen `database-setup.sql` i projektmappen
   - Kopiera hela innehållet och klistra in i SQL Editor
   - Klicka "RUN" för att skapa alla tabeller och policies

   Alternativt kan du köra följande SQL direkt:

   ```sql
   -- Aktivera RLS (Row Level Security)
   ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

   -- Skapa familjetabell
   CREATE TABLE families (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Skapa användartabell
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     full_name TEXT NOT NULL,
     avatar_url TEXT,
     family_id UUID REFERENCES families(id) ON DELETE SET NULL,
     role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
     points INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Skapa uppgiftstabell
   CREATE TABLE tasks (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     points INTEGER NOT NULL CHECK (points > 0),
     assigned_to UUID REFERENCES users(id) ON DELETE CASCADE,
     created_by UUID REFERENCES users(id) ON DELETE CASCADE,
     family_id UUID REFERENCES families(id) ON DELETE CASCADE,
     status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')) DEFAULT 'pending',
     due_date TIMESTAMP WITH TIME ZONE,
     completed_at TIMESTAMP WITH TIME ZONE,
     approved_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Skapa belöningstabell
   CREATE TABLE rewards (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT,
     points_required INTEGER NOT NULL CHECK (points_required > 0),
     family_id UUID REFERENCES families(id) ON DELETE CASCADE,
     created_by UUID REFERENCES users(id) ON DELETE CASCADE,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Skapa notifieringstabell
   CREATE TABLE notifications (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     title TEXT NOT NULL,
     message TEXT NOT NULL,
     type TEXT CHECK (type IN ('task_completed', 'task_assigned', 'reward_claimed', 'general')) NOT NULL,
     is_read BOOLEAN DEFAULT false,
     related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
     related_reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Skapa belöningsanspråkstabell
   CREATE TABLE reward_claims (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
     status TEXT CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
     claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     processed_at TIMESTAMP WITH TIME ZONE
   );

   -- Skapa funktion för att lägga till poäng
   CREATE OR REPLACE FUNCTION add_user_points(user_id UUID, points_to_add INTEGER)
   RETURNS VOID AS $$
   BEGIN
     UPDATE users
     SET points = points + points_to_add
     WHERE id = user_id;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Skapa RLS-policies
   ALTER TABLE families ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
   ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
   ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

   -- Policies för users
   CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
   CREATE POLICY "Users can view family members" ON users FOR SELECT USING (
     family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
   );

   -- Policies för families
   CREATE POLICY "Family members can view family" ON families FOR SELECT USING (
     id IN (SELECT family_id FROM users WHERE id = auth.uid())
   );

   -- Policies för tasks
   CREATE POLICY "Family members can view family tasks" ON tasks FOR SELECT USING (
     family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
   );
   CREATE POLICY "Family members can insert tasks" ON tasks FOR INSERT WITH CHECK (
     family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
   );
   CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (
     assigned_to = auth.uid() OR created_by = auth.uid()
   );

   -- Policies för rewards
   CREATE POLICY "Family members can view family rewards" ON rewards FOR SELECT USING (
     family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
   );

   -- Policies för notifications
   CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
   CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

   -- Policies för reward_claims
   CREATE POLICY "Users can view own reward claims" ON reward_claims FOR SELECT USING (user_id = auth.uid());
   CREATE POLICY "Users can insert own reward claims" ON reward_claims FOR INSERT WITH CHECK (user_id = auth.uid());
   ```

5. **Starta appen**:
   ```bash
   npm start
   ```

## Projektstruktur

```
src/
├── components/          # Återanvändbara komponenter
│   ├── TaskItem.tsx
│   ├── RewardItem.tsx
│   ├── FamilyMemberCard.tsx
│   ├── CreateTaskModal.tsx
│   └── index.ts
├── screens/             # Huvudskärmar
│   ├── LoginScreen.tsx
│   ├── TasksScreen.tsx
│   ├── RewardsScreen.tsx
│   ├── FamilyScreen.tsx
│   └── index.ts
├── services/            # API-tjänster
│   ├── supabase.ts
│   ├── authService.ts
│   ├── taskService.ts
│   └── index.ts
├── types/               # TypeScript-definitioner
│   └── index.ts
└── index.ts
```

## Användning

### Första gången

1. Registrera ett nytt konto
2. Skapa en ny familj (första användaren blir admin)
3. Bjud in andra familjemedlemmar via e-post

### Daglig användning

1. **Admin**: Skapa uppgifter och tilldela till familjemedlemmar
2. **Medlemmar**: Visa tilldelade uppgifter och markera som slutförda
3. **Admin**: Godkänn slutförda uppgifter (ger poäng till användaren)
4. **Medlemmar**: Använd poäng för att köpa belöningar

## Utveckling

### Lägga till nya funktioner

1. Definiera nya typer i `src/types/index.ts`
2. Skapa API-funktioner i relevanta service-filer
3. Bygg UI-komponenter i `src/components/`
4. Implementera skärmar i `src/screens/`

### Databasändringar

1. Gör ändringar i Supabase Dashboard
2. Uppdatera TypeScript-typer
3. Testa ändringar lokalt

## Kommande funktioner

- [ ] Push-notifieringar
- [ ] Bilduppladdning för uppgifter
- [ ] Återkommande uppgifter
- [ ] Belöningshistorik
- [ ] Familjestatistik
- [ ] Teman och anpassning

## Support

För frågor eller problem, skapa en issue eller kontakta utvecklaren.

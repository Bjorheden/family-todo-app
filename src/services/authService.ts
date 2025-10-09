import { supabase } from './supabase';
import { User, Family } from '../types';

export class AuthService {
  // Registrera ny användare
  static async signUp(email: string, password: string, fullName: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Användaren kunde inte skapas');

    // Skapa användarprofil
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        email: authData.user.email!,
        full_name: fullName,
        role: 'member',
        points: 0
      }])
      .select()
      .single();

    if (userError) throw userError;
    return userData;
  }

  // Logga in
  static async signIn(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Inloggning misslyckades');

    const user = await this.getCurrentUser();
    if (!user) throw new Error('Användarprofil hittades inte');

    return user;
  }

  // Logga ut
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Hämta aktuell användare
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) return null;
    return data;
  }

  // Skapa familj (endast admin)
  static async createFamily(name: string, adminId: string): Promise<Family> {
    const { data, error } = await supabase
      .from('families')
      .insert([{
        name,
        admin_id: adminId
      }])
      .select()
      .single();

    if (error) throw error;

    // Uppdatera användarens familj-ID och roll
    await supabase
      .from('users')
      .update({
        family_id: data.id,
        role: 'admin'
      })
      .eq('id', adminId);

    return data;
  }

  // Gå med i familj
  static async joinFamily(familyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        family_id: familyId,
        role: 'member'
      })
      .eq('id', userId);

    if (error) throw error;
  }

  // Hämta familjemedlemmar
  static async getFamilyMembers(familyId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('family_id', familyId)
      .order('role', { ascending: false }); // Admin först

    if (error) throw error;
    return data || [];
  }

  // Hämta familj
  static async getFamily(familyId: string): Promise<Family | null> {
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (error) return null;
    return data;
  }
}

export const authService = AuthService;
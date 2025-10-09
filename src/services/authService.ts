import { supabase } from './supabase';
import { User, Family } from '../types';

export class AuthService {
  // Register new user
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
    if (!authData.user) throw new Error('User could not be created');

    // Create user profile
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

  // Sign in user
  static async signIn(email: string, password: string): Promise<User> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Login failed');

    const user = await this.getCurrentUser();
    if (!user) throw new Error('User profile not found');

    return user;
  }

  // Sign out user
  static async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    console.log('Auth user:', authUser);
    if (!authUser) {
      console.log('No auth user found');
      return null;
    }

    console.log('Querying users table for ID:', authUser.id);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    console.log('User profile data:', data);
    console.log('User profile error:', error);
    
    if (error) {
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      console.log('Error details:', error.details);
    }
    
    if (error) return null;
    return data;
  }

  // Create family (admin only)
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

    // Update user's family ID and role
    await supabase
      .from('users')
      .update({
        family_id: data.id,
        role: 'admin'
      })
      .eq('id', adminId);

    return data;
  }

  // Join family
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

  // Get family members
  static async getFamilyMembers(familyId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('family_id', familyId)
      .order('role', { ascending: false }); // Admin first

    if (error) throw error;
    return data || [];
  }

  // Get family
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
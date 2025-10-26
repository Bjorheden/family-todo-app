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
    
    if (!authUser) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
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

  // Find family by invitation code (using family ID as code for now)
  static async findFamilyByCode(familyCode: string): Promise<Family | null> {
    
    // For now, we'll use the family ID as the invitation code
    // In a production app, you might want a separate invitation_code field
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyCode)
      .single();
    
    if (error) {
      console.error('Error finding family:', error);
      return null;
    }
    return data;
  }

  // Join family by invitation code
  static async joinFamilyByCode(familyCode: string, userId: string): Promise<void> {    
    // Check if user is already in a family
    const currentUser = await this.getCurrentUser();
    if (currentUser?.family_id) {
      throw new Error('You are already a member of a family. Please leave your current family first.');
    }

    // Try to join the family directly (the family ID is the code)
    // We'll let the database constraints and policies handle validation
    try {
      await this.joinFamily(familyCode, userId);      
      // Verify the join worked by checking if we can now see the family
      const updatedUser = await this.getCurrentUser();
      if (!updatedUser?.family_id) {
        throw new Error('Family join failed - family may not exist or you may not have permission');
      }
    } catch (error: any) {
      console.error('Join family error:', error);
      
      // Provide more user-friendly error messages
      if (error.message.includes('foreign key')) {
        throw new Error('Family not found. Please check the invitation code.');
      }
      
      throw error;
    }
  }

  // Join family (internal function)
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
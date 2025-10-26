import { taskService } from '../taskService';
import { supabase } from '../supabase';

// Use the manual mock
jest.mock('../supabase');

const mockSupabase = supabase as any;

describe('TaskService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementation
    mockSupabase.from.mockImplementation((tableName: string) => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      
      // For notifications table, return successful insert
      if (tableName === 'notifications') {
        mockQueryBuilder.insert = jest.fn().mockReturnThis();
        mockQueryBuilder.select = jest.fn().mockResolvedValue({ data: [], error: null });
      }
      
      return mockQueryBuilder;
    });
    
    // Mock RPC calls for points
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  describe('getFamilyTasks', () => {
    it('should fetch tasks for a family', async () => {
      const mockTasks = [
        { id: '1', title: 'Test Task', family_id: 'family1', status: 'pending', points: 5, assigned_to: 'user1', created_by: 'admin1', created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
        { id: '2', title: 'Another Task', family_id: 'family1', status: 'completed', points: 10, assigned_to: 'user2', created_by: 'admin1', created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTasks, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await taskService.getFamilyTasks('family1');

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(result).toEqual(mockTasks);
    });

    it('should throw error when database fails', async () => {
      const mockError = new Error('Database error');
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      };
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await expect(taskService.getFamilyTasks('family1')).rejects.toThrow('Database error');
    });
  });

  describe('createTask', () => {
    it('should create task for admin users', async () => {
      const mockTask = { 
        title: 'New Task', 
        family_id: 'family1', 
        assigned_to: 'user1',
        created_by: 'admin1',
        points: 10,
        status: 'pending' as const,
        description: null,
        due_date: null,
        completed_at: null,
        approved_at: null
      };

      const mockCreatedTask = { id: '123', ...mockTask };
      const mockQueryBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCreatedTask, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const result = await taskService.createTask(mockTask, 'admin');

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
      expect(result).toEqual(mockCreatedTask);
    });

    it('should reject task creation for non-admin users', async () => {
      const mockTask = { 
        title: 'New Task', 
        family_id: 'family1', 
        assigned_to: 'user1',
        created_by: 'user1',
        points: 10,
        status: 'pending' as const,
        description: null,
        due_date: null,
        completed_at: null,
        approved_at: null
      };

      await expect(taskService.createTask(mockTask, 'member')).rejects.toThrow('Only family admins can create tasks');
    });

    it('should allow task creation when userRole is not provided (current behavior)', async () => {
      const mockTask = { 
        title: 'New Task', 
        family_id: 'family1', 
        assigned_to: 'user1',
        created_by: 'user1',
        points: 10,
        status: 'pending' as const,
        description: null,
        due_date: null,
        completed_at: null,
        approved_at: null
      };

      const mockCreatedTask = { id: '123', ...mockTask };
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockCreatedTask, error: null }),
          };
        }
        if (tableName === 'notifications') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      const result = await taskService.createTask(mockTask, undefined);
      expect(result).toEqual(mockCreatedTask);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status and add completion timestamp', async () => {
      const mockUpdatedTask = { 
        id: '123', 
        status: 'completed',
        created_by: 'admin1',
        completed_at: expect.any(String)
      };

      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockUpdatedTask, error: null }),
          };
        }
        if (tableName === 'notifications') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      const result = await taskService.updateTaskStatus('123', 'completed', 'user1');

      expect(result.status).toBe('completed');
      expect(result.completed_at).toBeDefined();
    });

    it('should add points when task is approved', async () => {
      const mockTask = { 
        id: '123', 
        status: 'approved',
        assigned_to: 'user1',
        points: 10,
        approved_at: expect.any(String)
      };

      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockTask, error: null }),
          };
        }
        if (tableName === 'notifications') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      await taskService.updateTaskStatus('123', 'approved', 'admin1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('add_user_points', {
        user_id: 'user1',
        points_to_add: 10
      });
    });
  });

  describe('getPendingApprovalCount', () => {
    it('should return count of completed tasks awaiting approval', async () => {
      // Mock the tasks table query for getPendingApprovalCount
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          const secondEqMock = jest.fn().mockResolvedValue({ count: 3, error: null });
          const firstEqMock = jest.fn().mockReturnValue({ eq: secondEqMock });
          
          return {
            select: jest.fn().mockReturnValue({ eq: firstEqMock }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
          insert: jest.fn().mockReturnThis(),
        };
      });

      const result = await taskService.getPendingApprovalCount('family1');

      expect(result).toBe(3);
      expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
    });

    it('should return 0 when no pending approvals', async () => {
      mockSupabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          const secondEqMock = jest.fn().mockResolvedValue({ count: 0, error: null });
          const firstEqMock = jest.fn().mockReturnValue({ eq: secondEqMock });
          
          return {
            select: jest.fn().mockReturnValue({ eq: firstEqMock }),
          };
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
          insert: jest.fn().mockReturnThis(),
        };
      });

      const result = await taskService.getPendingApprovalCount('family1');

      expect(result).toBe(0);
    });
  });
});
const createMockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
});

export const supabase = {
  from: jest.fn().mockImplementation(() => createMockQueryBuilder()),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

export default supabase;
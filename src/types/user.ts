export interface Allocation {
  credit: number;
  total_used_credit: number;
  credit_used: {
    captcha: number;
    ai_completion: number;
  };
  used: {
    captcha: number;
    ai_completion: number;
  };
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
  provider_id?: string;
  provider_type?: string;
  allocation: Allocation;
  // Add other fields that might be in your User model
  // such as:
  // created_at?: string;
  // updated_at?: string;
}

// Default allocation values matching the migration
export const DEFAULT_ALLOCATION: Allocation = {
  credit: 5,
  total_used_credit: 0,
  credit_used: {
    captcha: 0,
    ai_completion: 0
  },
  used: {
    captcha: 0,
    ai_completion: 0
  }
};
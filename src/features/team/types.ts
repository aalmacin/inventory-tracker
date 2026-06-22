export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'supervisor';
  status: 'active' | 'pending';
  restaurantIds: string[];
}

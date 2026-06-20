export type Role = 'admin' | 'manager' | 'supervisor';

export interface CurrentUser {
    id: string;
    name: string;
    role: Role;
    restaurantIds: string[];
}

const FAKE_USER: CurrentUser = {
    id: 'u_1',
    name: 'Sam Rivera',
    role: 'manager',
    restaurantIds: ['r_1', 'r_2'],
};

export function useCurrentUser(): CurrentUser {
    return FAKE_USER;
}

export function isAdmin(user: CurrentUser): boolean {
    return user.role === 'admin';
}
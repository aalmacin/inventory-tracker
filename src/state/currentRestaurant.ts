export interface Restaurant {
    id: string;
    name: string;
}

const FAKE_RESTAURANTS: Restaurant[] = [
  { id: 'r_1', name: 'Harbour Grill' },
  { id: 'r_2', name: 'Downtown Diner' },
];

let currentId = 'r_1';

export function useRestaurants(): Restaurant[] {
    return FAKE_RESTAURANTS;
}

export function useCurrentRestaurant(): Restaurant {
    return FAKE_RESTAURANTS.find(r => r.id === currentId) ?? FAKE_RESTAURANTS[0];
}

export function setCurrentRestaurant(id: string): void {
    currentId = id;
}
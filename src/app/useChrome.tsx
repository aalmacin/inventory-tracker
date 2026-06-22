import { signOut } from 'firebase/auth';
import { RestaurantSwitcher, AccountMenu } from '../ui/shell';
import { auth } from '../lib/firebase';
import { useAppDispatch, useAppSelector } from '../lib/hooks';
import { selectCurrentRestaurant, selectMyRestaurants } from '../features/restaurants/selectors';
import { currentRestaurantSet } from '../features/restaurants/restaurantsSlice';

// The header chrome (restaurant switcher + account menu) fed from the store.
// Each main screen's container drops these into its AppHeader slots.
export function useChrome() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const role = useAppSelector((s) => s.auth.role);
  const restaurants = useAppSelector(selectMyRestaurants);
  const current = useAppSelector(selectCurrentRestaurant);

  return {
    restaurantName: current?.name ?? '',
    switcher: (
      <RestaurantSwitcher
        restaurants={restaurants}
        currentId={current?.id ?? null}
        onSwitch={(id) => dispatch(currentRestaurantSet(id))}
      />
    ),
    account:
      user && role ? (
        <AccountMenu
          user={{ name: user.name, email: user.email, role }}
          restaurantCount={restaurants.length}
          onSignOut={() => void signOut(auth)}
        />
      ) : null,
  };
}

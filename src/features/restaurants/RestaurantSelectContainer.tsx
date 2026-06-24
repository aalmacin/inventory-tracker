// RestaurantSelectContainer.tsx — feeds the selection screen from Redux and sets
// the current restaurant (currentId). The Firestore data (subscribeRestaurants)
// is yours; this only reads the slice and dispatches currentRestaurantSet.
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { RestaurantSelect } from '../../pages/RestaurantSelect';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { selectMyRestaurants } from './selectors';
import { currentRestaurantSet } from './restaurantsSlice';

export function RestaurantSelectContainer() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const mine = useAppSelector(selectMyRestaurants);
  const userName = useAppSelector((s) => s.auth.user?.name || undefined);

  return (
    <RestaurantSelect
      restaurants={mine.map((r) => ({ id: r.id, name: r.name, city: r.city, initials: r.initials, tint: r.tint }))}
      userName={userName}
      onSelect={(id) => {
        dispatch(currentRestaurantSet(id));
        nav('/', { replace: true });
      }}
      onSignOut={() => void signOut(auth)}
    />
  );
}

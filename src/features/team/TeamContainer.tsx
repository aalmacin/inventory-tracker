import { Team } from '../../pages/Team';
import { AppHeader } from '../../ui/shell';
import { useAppSelector } from '../../lib/hooks';
import { useChrome } from '../../app/useChrome';
import { selectCurrentRestaurant } from '../restaurants/selectors';
import * as fs from './firestore';

export function TeamContainer() {
  const chrome = useChrome();
  const members = useAppSelector((s) => s.team.members);
  const restaurants = useAppSelector((s) => s.restaurants.list);
  const current = useAppSelector(selectCurrentRestaurant);

  return (
    <Team
      header={<AppHeader title="Team" switcher={chrome.switcher} account={chrome.account} />}
      members={members}
      restaurants={restaurants}
      currentRestaurant={current ? { id: current.id, name: current.name, initials: current.initials } : null}
      onInvite={(input) => fs.inviteMember(input)}
      onUpdateMember={(id, input) => fs.updateMember(id, input)}
      onRemoveMember={(id) => fs.removeMember(id)}
      onResend={(id) => fs.resendInvite(id)}
    />
  );
}

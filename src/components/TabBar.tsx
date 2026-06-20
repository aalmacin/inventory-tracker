import { NavLink } from "react-router-dom";
import { isAdmin, useCurrentUser } from "../state/currentUser";

interface Tab {
    to: string;
    label: string;
    end?: boolean;
}

const ADMIN_TABS: Tab[] = [
    { to: '/restaurants', label: 'Restaurants' },
    { to: '/catalog', label: 'Catalog' },
    { to: '/team', label: 'Team' },
];

const STAFF_TABS: Tab[] = [
    { to: '/', label: 'Home', end: true },
    { to: '/reports', label: 'Reports' },
];

export default function TabBar() {
    const user = useCurrentUser();
    const admin = isAdmin(user);
    const tabs = admin ? ADMIN_TABS : STAFF_TABS;

    return (
        <nav className="tab-bar">
            {tabs.map(tab => (
                <NavLink
                    key={tab.to} to={tab.to}
                    end={tab.end}
                    className={({ isActive }) => isActive ? 'tab active' : 'tab'}>
                    {tab.label}
                </NavLink>
            ))}

            {!admin && (
                <NavLink to="/new" className="tab tab-primary">
                    + New Tracking
                </NavLink>
            )}
        </nav >
    )
}
import { Outlet } from 'react-router-dom'
import AccountMenu from './AccountMenu'
import './Layout.css'
import RestaurantSwitcher from './RestaurantSwitcher'
import TabBar from './TabBar'

export default function Layout() {
    return (
        <div className="app-shell">
            <header className="app-header">
                <RestaurantSwitcher />
                <AccountMenu />
            </header>

            <main className="app-main">
                <Outlet />
            </main>

            <TabBar />
        </div>
    )
}
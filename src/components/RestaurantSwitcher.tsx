import "./RestaurantSwitcher.css"
import { setCurrentRestaurant, useCurrentRestaurant, useRestaurants } from "../state/currentRestaurant"
import { isAdmin, useCurrentUser } from "../state/currentUser"

export default function RestaurantSwitcher() {
    const user = useCurrentUser()
    const all = useRestaurants()
    const current = useCurrentRestaurant()

    const options = isAdmin(user)
        ? all
        : all.filter(r => user.restaurantIds.includes(r.id))

    if (options.length <= 1) {
        return <span className="restaurant-chip">{current.name}</span>
    }

    return (
        <select className="restaurant-chip" value={current.id} onChange={e => setCurrentRestaurant(e.target.value)}>
            {options.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
    )
}
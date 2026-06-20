import { useCurrentUser } from "../state/currentUser";
import "./AccountMenu.css"

export default function AccountMenu() {
    const user = useCurrentUser()

    return (
        <div className="account-menu">
            <span>{user.name}</span>
            <button type="button">Sign out</button>
        </div>
    )
}
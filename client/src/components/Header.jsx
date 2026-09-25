import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);

  const handleNotificationClick = () => {
    alert("No new notifications");
  };

  return (
    <header className="bg-[#182233] shadow-md">
      <div className="flex justify-between items-center max-w-6xl mx-auto p-4">
        
        {/* Logo */}
        <Link to="/">
          <h1 className="font-bold text-xl sm:text-2xl">
            <span className="text-white">fyndyourhomes</span>
            <span className="text-blue-400">.in</span>
          </h1>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          
          {/* Home */}
          <Link
            to="/"
            className="text-white hover:text-blue-400 transition"
          >
            Home
          </Link>

          {currentUser?.isAdmin && (
            <Link
              to="/admin-dashboard"
              className="text-white hover:text-blue-400 transition"
            >
              Admin
            </Link>
          )}

          {/* Working Notification Bell */}
          <button
            type="button"
            onClick={handleNotificationClick}
            className="text-white text-2xl hover:scale-110 transition-transform"
            title="Notifications"
          >
            🔔
          </button>

          {/* Profile */}
          <Link to="/profile">
            {currentUser ? (
              <img
                className="rounded-full h-9 w-9 object-cover border border-gray-400"
                src={currentUser.avatar}
                alt="profile"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border border-gray-400 flex items-center justify-center text-white">
                👤
              </div>
            )}
          </Link>

        </div>
      </div>
    </header>
  );
}

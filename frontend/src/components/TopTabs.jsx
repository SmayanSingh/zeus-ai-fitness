import { NavLink } from "react-router-dom";

export default function TopTabs() {
  return (
    <div className="top-tabs">
      <NavLink to="/" end className="tab-btn">
        Home
      </NavLink>

      <NavLink to="/workout" className="tab-btn">
        Start Workout
      </NavLink>

      <NavLink to="/history" className="tab-btn">
        History
      </NavLink>

      <NavLink to="/profile" className="tab-btn">
        Profile
      </NavLink>
    </div>
  );
}
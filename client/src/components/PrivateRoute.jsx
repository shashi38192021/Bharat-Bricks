import { useSelector } from "react-redux";
import { Outlet, Navigate } from "react-router-dom";

const PrivateRoute = () => {
  const { currentUser } = useSelector((state) => state.user);

  if (currentUser) return <Outlet />;

  const destination =
    localStorage.getItem("hasAuthenticatedBefore") === "true"
      ? "/sign-in"
      : "/sign-up";

  return <Navigate to={destination} replace />;
};

export default PrivateRoute;

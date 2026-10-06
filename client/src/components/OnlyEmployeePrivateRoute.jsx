import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const OnlyEmployeePrivateRoute = () => {
  const { currentUser } = useSelector((state) => state.user);
  const allowed = currentUser?.isAdmin === true || (
    currentUser?.role === "employee" && currentUser?.employeeApproved === true
  );

  if (!currentUser) {
    const destination =
      localStorage.getItem("hasAuthenticatedBefore") === "true"
        ? "/sign-in"
        : "/sign-up";
    return <Navigate to={destination} replace />;
  }

  return allowed ? <Outlet /> : <Navigate to="/" replace />;
};

export default OnlyEmployeePrivateRoute;

import { useDispatch } from "react-redux";
import { logout } from "../../store/slices/authSlice";
import { auth } from "../../api/api";
import { useNavigate } from "react-router-dom";

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (err) {
      console.error("Erreur lors du logout:", err);
    } finally {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  return handleLogout;
};

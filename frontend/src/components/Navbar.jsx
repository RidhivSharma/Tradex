import { useNavigate } from "react-router-dom";
import { removeToken } from "../utils/token";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    removeToken();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div>
        <h1>Tradex Dashboard</h1>
        <p>Live TradingView alerts pushed from your backend</p>
      </div>
      <button className="danger-button" onClick={logout}>
        Logout
      </button>
    </header>
  );
}

export default Navbar;

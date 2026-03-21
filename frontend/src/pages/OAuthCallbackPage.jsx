import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { setToken } from "../utils/token";

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      setToken(token);
      navigate("/dashboard", { replace: true });
      return;
    }

    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    navigate("/login?error=missing_token", { replace: true });
  }, [navigate, searchParams]);

  return (
    <main className="center-page">
      <Spinner label="Finalizing Google login..." />
    </main>
  );
}

export default OAuthCallbackPage;

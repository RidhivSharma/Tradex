import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getGoogleLoginUrl, loginWithEmailPassword } from "../api/auth";
import { setToken } from "../utils/token";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const oauthError = searchParams.get("error");
  const redirectPath = location.state?.from || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginWithEmailPassword({ email, password });
      if (data?.token) {
        setToken(data.token);
        navigate(redirectPath, { replace: true });
        return;
      }

      setError(data?.msg || "Login failed. Please try again.");
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Unable to login right now.");
    } finally {
      setLoading(false);
    }
  };

  const startGoogleLogin = () => {
    window.location.href = getGoogleLoginUrl();
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-block">
          <h1>Tradex</h1>
          <p>Sign in to continue to your live alerts dashboard.</p>
        </div>

        {oauthError ? <p className="error-text">Google login failed: {oauthError}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button onClick={startGoogleLogin} className="google-button" type="button">
          Login with Google
        </button>
      </section>
    </main>
  );
}

export default LoginPage;

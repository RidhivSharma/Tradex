import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserAlerts } from "../api/alerts";
import { connectGmailForAlerts, fetchConnectionProfile } from "../api/auth";
import AlertCard from "../components/AlertCard";
import Navbar from "../components/Navbar";
import Spinner from "../components/Spinner";
import { removeToken } from "../utils/token";

const POLL_INTERVAL = 5000;

function DashboardPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [gmailToRead, setGmailToRead] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [connectError, setConnectError] = useState("");
  const [connectStatus, setConnectStatus] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [newAlertIds, setNewAlertIds] = useState([]);
  const previousAlertIdsRef = useRef([]);

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [alerts]);

  const loadAlerts = useCallback(
    async (background = false) => {
      if (!background) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        setError("");
        const result = await fetchUserAlerts();
        setAlerts(result);
      } catch (apiError) {
        if (apiError?.response?.status === 401) {
          removeToken();
          navigate("/login", { replace: true });
          return;
        }

        setError(apiError?.response?.data?.message || "Failed to fetch alerts.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(() => {
      loadAlerts(true);
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [loadAlerts]);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);

    try {
      const profileData = await fetchConnectionProfile();
      setProfile(profileData);

      if (profileData?.gmailToRead) {
        setGmailToRead(profileData.gmailToRead);
      }
      if (profileData?.whatsappNumber) {
        setWhatsappNumber(profileData.whatsappNumber);
      }
    } catch (apiError) {
      if (apiError?.response?.status === 401) {
        removeToken();
        navigate("/login", { replace: true });
        return;
      }
      setConnectError(apiError?.response?.data?.message || "Failed to load connection status.");
    } finally {
      setProfileLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const currentIds = alerts.map((alert) => alert._id).filter(Boolean);
    const previousIds = previousAlertIdsRef.current;

    if (previousIds.length === 0) {
      previousAlertIdsRef.current = currentIds;
      return;
    }

    const incomingIds = currentIds.filter((id) => !previousIds.includes(id));
    if (incomingIds.length > 0) {
      setNewAlertIds(incomingIds);
      window.setTimeout(() => {
        setNewAlertIds([]);
      }, 1500);
    }

    previousAlertIdsRef.current = currentIds;
  }, [alerts]);

  const connectGmail = async (event) => {
    event.preventDefault();
    setConnectError("");
    setConnectStatus("");
    setConnecting(true);

    const submitPayload = async (forceUpdate = false) => {
      const data = await connectGmailForAlerts({
        gmailToRead,
        whatsappNumber,
        forceUpdate,
      });

      if (data?.alreadyExists) {
        const shouldUpdate = window.confirm(
          `${data.msg}\n\nSelect OK to replace with the new Gmail, or Cancel to keep your current Gmail.`
        );

        if (!shouldUpdate) {
          setConnectStatus(`Keeping existing Gmail: ${data.currentGmail}`);
          return;
        }

        const forcedData = await submitPayload(true);
        return forcedData;
      }

      if (data?.url) {
        await loadProfile();
        window.location.href = data.url;
        return;
      }

      setConnectStatus(data?.msg || "Settings saved, but no Google URL was returned.");
      await loadProfile();
      return data;
    };

    try {
      await submitPayload(false);
    } catch (apiError) {
      if (apiError?.response?.status === 401) {
        removeToken();
        navigate("/login", { replace: true });
        return;
      }

      setConnectError(apiError?.response?.data?.message || "Failed to connect Gmail for alerts.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <main className="dashboard-shell">
      <Navbar />

      <section className="connect-card">
        <div className="connect-head">
          <h2>Connect Gmail for TradingView Alerts</h2>
          <p>Set the Gmail inbox and WhatsApp number to receive TradingView alert notifications.</p>
        </div>

        <section className="status-card">
          <h3>Connected Gmail Status</h3>
          {profileLoading ? (
            <p>Loading connection status...</p>
          ) : (
            <div className="status-grid">
              <p>
                <strong>Email:</strong> {profile?.email || "N/A"}
              </p>
              <p>
                <strong>Gmail To Read:</strong> {profile?.gmailToRead || "Not connected"}
              </p>
              <p>
                <strong>WhatsApp Number:</strong>{" "}
                {profile?.whatsappNumber ? `+91${profile.whatsappNumber}` : "Not set"}
              </p>
              <p>
                <strong>Google Connected:</strong> {profile?.isGoogleConnected ? "Yes" : "No"}
              </p>
            </div>
          )}
        </section>

        {connectError ? <p className="error-text">{connectError}</p> : null}
        {connectStatus ? <p className="success-text">{connectStatus}</p> : null}

        <form className="connect-form" onSubmit={connectGmail}>
          <div className="form-field">
            <label htmlFor="gmailToRead">Gmail To Read</label>
            <input
              id="gmailToRead"
              type="email"
              placeholder="you@gmail.com"
              value={gmailToRead}
              onChange={(e) => setGmailToRead(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="whatsappNumber">WhatsApp Number (India, no +91)</label>
            <input
              id="whatsappNumber"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder="9876543210"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          <button type="submit" className="primary-button" disabled={connecting}>
            {connecting ? "Saving..." : "Save and Continue with Google"}
          </button>
        </form>
      </section>

      <section className="dashboard-header">
        <h2>Recent Alerts</h2>
        <button
          type="button"
          className="secondary-button"
          onClick={() => loadAlerts(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </section>

      {loading ? <Spinner label="Fetching your alerts..." /> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error && sortedAlerts.length === 0 ? (
        <section className="empty-state">
          <h3>No alerts yet</h3>
          <p>When a TradingView alert is processed and WhatsApp notification is sent, it will appear here.</p>
        </section>
      ) : null}

      {!loading && !error && sortedAlerts.length > 0 ? (
        <section className="alerts-grid">
          {sortedAlerts.map((alert, index) => (
            <AlertCard
              key={alert._id || `${alert.symbol}-${alert.createdAt}`}
              alert={alert}
              index={index}
              isNew={Boolean(alert._id && newAlertIds.includes(alert._id))}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}

export default DashboardPage;

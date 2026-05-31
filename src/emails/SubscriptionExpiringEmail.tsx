/* eslint-disable react/no-unescaped-entities */
interface SubscriptionExpiringEmailProps {
  name?: string;
  planName?: string;
  expiryDate?: string;
  billingUrl?: string;
}

export function SubscriptionExpiringEmail({
  name = "there",
  planName = "Pro Plan",
  expiryDate = "in 7 days",
  billingUrl = "https://app.saasplatform.com/billing",
}: SubscriptionExpiringEmailProps) {
  return (
    <table style={styles.outerTable}>
      <tr>
        <td align="center">
          <table style={styles.container}>
            {/* Header / Logo */}
            <tr>
              <td style={styles.header}>
                <div style={styles.logoContainer}>
                  <span style={styles.logoIcon}>▲</span>
                  <span style={styles.logoText}>Antigravity SaaS</span>
                </div>
              </td>
            </tr>

            {/* Body */}
            <tr>
              <td style={styles.body}>
                <div style={styles.alertCard}>
                  <span style={styles.alertIcon}>💳</span>
                  <div style={styles.alertContent}>
                    <strong style={styles.alertTitle}>Subscription Renewal Alert</strong>
                    <p style={styles.alertDesc}>
                      Your premium subscription status is scheduled to renew or expire shortly.
                    </p>
                  </div>
                </div>

                <h1 style={styles.heading}>Hi {name},</h1>
                <p style={styles.text}>
                  This is a friendly reminder that your <strong style={{ color: "#fafafa" }}>{planName}</strong> subscription is expiring or renewing on <strong>{expiryDate}</strong> (exactly 7 days from now).
                </p>

                <p style={styles.text}>
                  To prevent any service interruptions to your organization's active AI engines, custom domains, or database storage capacities, please ensure your billing credentials and payment methods are fully up to date.
                </p>

                {/* Divider */}
                <div style={styles.divider} />

                {/* CTA Button */}
                <table style={styles.buttonContainer}>
                  <tr>
                    <td align="center">
                      <a href={billingUrl} target="_blank" rel="noopener noreferrer" style={styles.button}>
                        Manage Subscription & Billing
                      </a>
                    </td>
                  </tr>
                </table>

                <p style={styles.signature}>
                  Best regards,<br />
                  <strong>The Antigravity Team</strong>
                </p>
              </td>
            </tr>

            {/* Footer */}
            <tr>
              <td style={styles.footer}>
                <p style={styles.footerText}>
                  This is an automated subscription tracking notification from Antigravity SaaS.<br />
                  © 2026 Antigravity Inc, 100 Pine Street, San Francisco, CA.
                </p>
                <p style={styles.footerText}>
                  <a href="#" style={styles.footerLink}>Configure Notifications</a> • <a href="#" style={styles.footerLink}>Support Portal</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
}

const styles = {
  outerTable: {
    width: "100%",
    backgroundColor: "#09090b",
    margin: 0,
    padding: "40px 0",
  },
  container: {
    maxWidth: "580px",
    width: "100%",
    backgroundColor: "#0f0f11",
    border: "1px solid #27272a",
    borderRadius: "16px",
    borderCollapse: "collapse" as const,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  header: {
    padding: "32px 40px 24px 40px",
    borderBottom: "1px solid #1f1f23",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIcon: {
    fontSize: "20px",
    color: "#6366f1",
    fontWeight: "bold",
  },
  logoText: {
    fontSize: "16px",
    fontWeight: "bold" as const,
    color: "#fafafa",
    letterSpacing: "-0.5px",
  },
  body: {
    padding: "40px 40px 32px 40px",
  },
  alertCard: {
    display: "flex",
    gap: "12px",
    padding: "16px 20px",
    backgroundColor: "#181825",
    border: "1px solid #312e81",
    borderRadius: "12px",
    marginBottom: "32px",
  },
  alertIcon: {
    fontSize: "20px",
    lineHeight: "1.2",
  },
  alertContent: {
    display: "flex",
    flexDirection: "column" as const,
  },
  alertTitle: {
    fontSize: "14px",
    fontWeight: "700" as const,
    color: "#c7d2fe",
    marginBottom: "4px",
  },
  alertDesc: {
    fontSize: "13px",
    color: "#a5b4fc",
    margin: 0,
    lineHeight: "1.4",
  },
  heading: {
    fontSize: "18px",
    fontWeight: "700" as const,
    color: "#fafafa",
    margin: "0 0 16px 0",
    letterSpacing: "-0.4px",
  },
  text: {
    fontSize: "14px",
    color: "#a1a1aa",
    margin: "0 0 20px 0",
    lineHeight: "1.6",
  },
  divider: {
    height: "1px",
    backgroundColor: "#1f1f23",
    margin: "32px 0",
  },
  buttonContainer: {
    width: "100%",
    margin: "24px 0",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#4f46e5",
    border: "1px solid #6366f1",
    borderRadius: "12px",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "bold" as const,
    textDecoration: "none",
    padding: "12px 28px",
    textAlign: "center" as const,
  },
  signature: {
    fontSize: "13px",
    color: "#a1a1aa",
    margin: "32px 0 0 0",
    lineHeight: "1.5",
  },
  footer: {
    padding: "32px 40px",
    backgroundColor: "#09090b",
    borderTop: "1px solid #1f1f23",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
  },
  footerText: {
    fontSize: "11px",
    color: "#52525b",
    lineHeight: "1.6",
    margin: "0 0 12px 0",
  },
  footerLink: {
    color: "#71717a",
    textDecoration: "underline",
  },
};

export default SubscriptionExpiringEmail;

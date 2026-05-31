interface LowCreditsEmailProps {
  name?: string;
  orgName?: string;
  remainingCredits?: number;
  totalCredits?: number;
  pricingUrl?: string;
}

export function LowCreditsEmail({
  name = "there",
  orgName = "Acme Corp",
  remainingCredits = 8500,
  totalCredits = 100000,
  pricingUrl = "https://app.saasplatform.com/settings/billing",
}: LowCreditsEmailProps) {
  const percentageLeft = Math.round((remainingCredits / totalCredits) * 100);

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
                  <span style={styles.alertIcon}>⚠️</span>
                  <div style={styles.alertContent}>
                    <strong style={styles.alertTitle}>AI Quota Alert: {percentageLeft}% Remaining</strong>
                    <p style={styles.alertDesc}>
                      Your organization is running low on AI credits. To avoid request failures, please upgrade your plan.
                    </p>
                  </div>
                </div>

                <h1 style={styles.heading}>Hi {name},</h1>
                <p style={styles.text}>
                  This is a friendly reminder that your organization, <strong style={{ color: "#fafafa" }}>{orgName}</strong>, has consumed {100 - percentageLeft}% of its monthly allocated AI credits. 
                </p>

                {/* Progress bar container */}
                <table style={styles.progressContainer}>
                  <tr>
                    <td>
                      <div style={styles.progressBarBg}>
                        <div style={{ ...styles.progressBarFill, width: `${percentageLeft}%` }} />
                      </div>
                      <div style={styles.progressTextContainer}>
                        <span style={styles.progressLabel}>Credits Remaining</span>
                        <span style={styles.progressValue}>{remainingCredits.toLocaleString()} / {totalCredits.toLocaleString()} ({percentageLeft}%)</span>
                      </div>
                    </td>
                  </tr>
                </table>

                <p style={styles.text}>
                  Once all credits are exhausted, any active API request to translation, chat, summaries, and image recognition endpoints will return quota errors until your billing cycle resets or you purchase an upgrade.
                </p>

                {/* Divider */}
                <div style={styles.divider} />

                {/* CTA Button */}
                <table style={styles.buttonContainer}>
                  <tr>
                    <td align="center">
                      <a href={pricingUrl} target="_blank" rel="noopener noreferrer" style={styles.button}>
                        Upgrade AI Plan / Add Credits
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
                  This is an automated resource consumption alert from Antigravity SaaS for {orgName}.<br />
                  © 2026 Antigravity Inc, 100 Pine Street, San Francisco, CA.
                </p>
                <p style={styles.footerText}>
                  <a href="#" style={styles.footerLink}>Configure Alerts</a> • <a href="#" style={styles.footerLink}>Support Portal</a>
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
    color: "#f59e0b",
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
    backgroundColor: "#2a1e12",
    border: "1px solid #78350f",
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
    color: "#fde68a",
    marginBottom: "4px",
  },
  alertDesc: {
    fontSize: "13px",
    color: "#fbbf24",
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
  progressContainer: {
    width: "100%",
    margin: "24px 0",
  },
  progressBarBg: {
    width: "100%",
    height: "8px",
    backgroundColor: "#27272a",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#f59e0b",
    borderRadius: "4px",
  },
  progressTextContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "8px",
  },
  progressLabel: {
    fontSize: "12px",
    color: "#71717a",
  },
  progressValue: {
    fontSize: "12px",
    fontWeight: "600" as const,
    color: "#f4f4f5",
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
    backgroundColor: "#d97706",
    border: "1px solid #f59e0b",
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

export default LowCreditsEmail;

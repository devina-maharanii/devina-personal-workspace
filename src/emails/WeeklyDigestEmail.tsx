interface WeeklyDigestEmailProps {
  name?: string;
  orgName?: string;
  aiRequestsCount?: number;
  tokensUsed?: string;
  storageUsed?: string;
  activeMembersCount?: number;
  dashboardUrl?: string;
}

export function WeeklyDigestEmail({
  name = "there",
  orgName = "Acme Corp",
  aiRequestsCount = 1420,
  tokensUsed = "842,500",
  storageUsed = "1.2 GB",
  activeMembersCount = 8,
  dashboardUrl = "https://app.saasplatform.com/dashboard",
}: WeeklyDigestEmailProps) {
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
                <h1 style={styles.heading}>Your Weekly Digest</h1>
                <p style={styles.text}>
                  Hello {name}, here is the activity and resource consumption report for your organization <strong style={{ color: "#fafafa" }}>{orgName}</strong> for the past 7 days.
                </p>

                {/* Divider */}
                <div style={styles.divider} />

                {/* Metrics Blocks */}
                <h3 style={styles.sectionTitle}>Key Usage Metrics</h3>
                
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
                  <tr>
                    {/* Stat Card 1 */}
                    <td style={{ width: "50%", paddingRight: "8px" }}>
                      <div style={styles.statCard}>
                        <span style={styles.statLabel}>AI Requests</span>
                        <span style={styles.statValue}>{aiRequestsCount}</span>
                      </div>
                    </td>
                    
                    {/* Stat Card 2 */}
                    <td style={{ width: "50%", paddingLeft: "8px" }}>
                      <div style={styles.statCard}>
                        <span style={styles.statLabel}>Tokens Consumed</span>
                        <span style={styles.statValue}>{tokensUsed}</span>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style={{ height: "16px" }} colSpan={2}></td>
                  </tr>
                  
                  <tr>
                    {/* Stat Card 3 */}
                    <td style={{ width: "50%", paddingRight: "8px" }}>
                      <div style={styles.statCard}>
                        <span style={styles.statLabel}>Storage Growth</span>
                        <span style={styles.statValue}>{storageUsed}</span>
                      </div>
                    </td>
                    
                    {/* Stat Card 4 */}
                    <td style={{ width: "50%", paddingLeft: "8px" }}>
                      <div style={styles.statCard}>
                        <span style={styles.statLabel}>Active Teammates</span>
                        <span style={styles.statValue}>{activeMembersCount}</span>
                      </div>
                    </td>
                  </tr>
                </table>

                {/* Divider */}
                <div style={styles.divider} />

                {/* Engagement Tips Block */}
                <div style={styles.tipsBlock}>
                  <strong style={styles.tipTitle}>💡 Pro Tip: Optimize Your AI Spends</strong>
                  <p style={styles.tipDesc}>
                    Did you know that using specialized prompts with length limits can reduce your input token footprint by up to 35%? Head over to the Analytics Dashboard to inspect which endpoints consume the highest volume of output tokens.
                  </p>
                </div>

                {/* Divider */}
                <div style={styles.divider} />

                {/* CTA Button */}
                <table style={styles.buttonContainer}>
                  <tr>
                    <td align="center">
                      <a href={dashboardUrl} target="_blank" rel="noopener noreferrer" style={styles.button}>
                        View Analytics Dashboard
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
                  This is a weekly utility summary dispatched to you based on your notification settings for {orgName}.<br />
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
  heading: {
    fontSize: "22px",
    fontWeight: "800" as const,
    color: "#fafafa",
    margin: "0 0 16px 0",
    letterSpacing: "-0.5px",
    lineHeight: "1.3",
  },
  text: {
    fontSize: "14px",
    color: "#a1a1aa",
    margin: "0 0 24px 0",
    lineHeight: "1.6",
  },
  divider: {
    height: "1px",
    backgroundColor: "#1f1f23",
    margin: "32px 0",
  },
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    color: "#818cf8",
    letterSpacing: "1px",
    margin: "0 0 20px 0",
  },
  statCard: {
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    padding: "16px 20px",
  },
  statLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600" as const,
    color: "#71717a",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  statValue: {
    display: "block",
    fontSize: "20px",
    fontWeight: "700" as const,
    color: "#fafafa",
  },
  tipsBlock: {
    backgroundColor: "#13131a",
    borderLeft: "4px solid #6366f1",
    borderRadius: "8px",
    padding: "16px 20px",
    margin: "24px 0",
  },
  tipTitle: {
    fontSize: "14px",
    fontWeight: "700" as const,
    color: "#e4e4e7",
    display: "block",
    marginBottom: "6px",
  },
  tipDesc: {
    fontSize: "13px",
    color: "#a1a1aa",
    margin: 0,
    lineHeight: "1.5",
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

export default WeeklyDigestEmail;

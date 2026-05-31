interface WelcomeEmailProps {
  name?: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({ name = "there", dashboardUrl = "https://app.saasplatform.com/dashboard" }: WelcomeEmailProps) {
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
                <h1 style={styles.heading}>Welcome to the platform, {name}!</h1>
                <p style={styles.text}>
                  We are absolutely thrilled to have you join us. Antigravity is a modern developer-first workspace designed to speed up your AI workflows, securely manage assets, and monitor analytics insights in real-time.
                </p>

                {/* Divider */}
                <div style={styles.divider} />

                {/* Value Props / Highlight Grid */}
                <h3 style={styles.sectionTitle}>3 steps to unleash Antigravity:</h3>
                
                <table style={styles.propGrid}>
                  {/* Highlight 1 */}
                  <tr>
                    <td style={styles.propIconCol}>
                      <div style={styles.propIcon}>🚀</div>
                    </td>
                    <td style={styles.propTextCol}>
                      <strong style={styles.propTitle}>Run Advanced AI Models</strong>
                      <p style={styles.propDesc}>Access deep learning prompts, translations, summaries, and vision analysis in milliseconds.</p>
                    </td>
                  </tr>

                  {/* Highlight 2 */}
                  <tr>
                    <td style={styles.propIconCol}>
                      <div style={styles.propIcon}>🗄️</div>
                    </td>
                    <td style={styles.propTextCol}>
                      <strong style={styles.propTitle}>Secure File Management</strong>
                      <p style={styles.propDesc}>Instantly drag and drop assets into secure folders with auto storage capacity locks.</p>
                    </td>
                  </tr>

                  {/* Highlight 3 */}
                  <tr>
                    <td style={styles.propIconCol}>
                      <div style={styles.propIcon}>📊</div>
                    </td>
                    <td style={styles.propTextCol}>
                      <strong style={styles.propTitle}>Granular System Analytics</strong>
                      <p style={styles.propDesc}>Keep perfect tabs on token spending, estimated API costs, and developer request histories.</p>
                    </td>
                  </tr>
                </table>

                {/* Divider */}
                <div style={styles.divider} />

                {/* CTA Button */}
                <table style={styles.buttonContainer}>
                  <tr>
                    <td align="center">
                      <a href={dashboardUrl} target="_blank" rel="noopener noreferrer" style={styles.button}>
                        Launch Your Dashboard
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
                  This email was dispatched to you because you created an account on Antigravity SaaS.<br />
                  © 2026 Antigravity Inc, 100 Pine Street, San Francisco, CA.
                </p>
                <p style={styles.footerText}>
                  <a href="#" style={styles.footerLink}>Unsubscribe</a> • <a href="#" style={styles.footerLink}>Support Portal</a>
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
  propGrid: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  propIconCol: {
    verticalAlign: "top",
    width: "48px",
    paddingBottom: "20px",
  },
  propIcon: {
    width: "36px",
    height: "36px",
    lineHeight: "36px",
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "10px",
    textAlign: "center" as const,
    fontSize: "16px",
  },
  propTextCol: {
    verticalAlign: "top",
    paddingLeft: "14px",
    paddingBottom: "20px",
  },
  propTitle: {
    fontSize: "13px",
    fontWeight: "700" as const,
    color: "#f4f4f5",
    display: "block",
    margin: "0 0 4px 0",
  },
  propDesc: {
    fontSize: "12px",
    color: "#71717a",
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

export default WelcomeEmail;

/* eslint-disable react/no-unescaped-entities */
interface SubscriptionConfirmEmailProps {
  name?: string;
  planName?: string;
  price?: string;
  amountPaid?: string;
  nextBillingDate?: string;
  features?: string[];
}

export function SubscriptionConfirmEmail({
  name = "Partner",
  planName = "Pro Monthly",
  price = "$29.00/mo",
  amountPaid = "$29.00",
  nextBillingDate = "June 20, 2026",
  features = [
    "Unlimited AI Prompts & Credits",
    "64MB Maximum File uploads limits",
    "Advanced team analytics dashboards",
    "Custom domains verification",
    "24/7 Priority support lines",
  ],
}: SubscriptionConfirmEmailProps) {
  return (
    <table style={styles.outerTable}>
      <tr>
        <td align="center">
          <table style={styles.container}>
            {/* Header */}
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
                <h1 style={styles.heading}>Subscription Confirmed!</h1>
                <p style={styles.text}>
                  Hello {name}, thank you for subscribing to the <strong style={styles.highlight}>{planName}</strong>! Your account has been upgraded successfully. You now have complete access to our premium developer features.
                </p>

                {/* Receipt Card */}
                <table style={styles.receiptCard}>
                  <tr>
                    <td>
                      <h3 style={styles.receiptTitle}>Invoice Receipt Summary</h3>
                      <table style={styles.receiptTable}>
                        <tr style={styles.receiptRow}>
                          <td style={styles.receiptLabel}>Upgraded Tier Plan:</td>
                          <td style={styles.receiptValue}>{planName} ({price})</td>
                        </tr>
                        <tr style={styles.receiptRow}>
                          <td style={styles.receiptLabel}>Amount Charged:</td>
                          <td style={styles.receiptValuePaid}>{amountPaid}</td>
                        </tr>
                        <tr style={styles.receiptRow}>
                          <td style={styles.receiptLabel}>Payment Status:</td>
                          <td style={styles.receiptValuePaid}>
                            <span style={styles.badge}>PAID</span>
                          </td>
                        </tr>
                        <tr style={styles.receiptRow}>
                          <td style={styles.receiptLabel}>Next Billing Date:</td>
                          <td style={styles.receiptValue}>{nextBillingDate}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                {/* Divider */}
                <div style={styles.divider} />

                {/* Unlocked Features */}
                <h3 style={styles.sectionTitle}>What's included in your Plan:</h3>
                <ul style={styles.featureList}>
                  {features.map((feat, index) => (
                    <li key={index} style={styles.featureItem}>
                      <span style={styles.featureCheck}>✓</span> {feat}
                    </li>
                  ))}
                </ul>

                {/* Divider */}
                <div style={styles.divider} />

                {/* CTA Button */}
                <table style={styles.buttonContainer}>
                  <tr>
                    <td align="center">
                      <a href="https://app.saasplatform.com/dashboard" target="_blank" rel="noopener noreferrer" style={styles.button}>
                        Go to Dashboard
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
                  This email serves as an official confirmation of subscription payment. You can manage subscriptions and retrieve past invoices inside your <a href="https://app.saasplatform.com/billing" style={styles.footerLink}>Billing Center</a>.<br />
                  © 2026 Antigravity Inc, 100 Pine Street, San Francisco, CA.
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
  highlight: {
    color: "#f4f4f5",
  },
  receiptCard: {
    width: "100%",
    backgroundColor: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "14px",
    padding: "20px",
    margin: "24px 0",
    borderCollapse: "collapse" as const,
  },
  receiptTitle: {
    fontSize: "12px",
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    color: "#818cf8",
    letterSpacing: "1px",
    margin: "0 0 16px 0",
  },
  receiptTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  receiptRow: {
    borderBottom: "1px solid #27272a",
  },
  receiptLabel: {
    padding: "10px 0",
    fontSize: "12px",
    color: "#a1a1aa",
    fontWeight: "500" as const,
  },
  receiptValue: {
    padding: "10px 0",
    fontSize: "12px",
    color: "#e4e4e7",
    textAlign: "right" as const,
    fontWeight: "600" as const,
  },
  receiptValuePaid: {
    padding: "10px 0",
    fontSize: "12px",
    color: "#10b981",
    textAlign: "right" as const,
    fontWeight: "700" as const,
  },
  badge: {
    backgroundColor: "#064e3b",
    color: "#34d399",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "800" as const,
    border: "1px solid #047857",
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
    margin: "0 0 16px 0",
  },
  featureList: {
    padding: 0,
    margin: 0,
    listStyleType: "none",
  },
  featureItem: {
    fontSize: "12px",
    color: "#a1a1aa",
    lineHeight: "1.8",
    marginBottom: "8px",
  },
  featureCheck: {
    color: "#10b981",
    fontWeight: "bold" as const,
    marginRight: "6px",
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
    margin: 0,
  },
  footerLink: {
    color: "#71717a",
    textDecoration: "underline",
  },
};

export default SubscriptionConfirmEmail;

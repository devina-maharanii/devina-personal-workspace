interface PaymentFailedEmailProps {
  name?: string;
  planName?: string;
  amount?: string;
  updateBillingUrl?: string;
  gracePeriodEnd?: string;
}

export function PaymentFailedEmail({
  name = "there",
  planName = "Pro",
  amount = "$29.00",
  updateBillingUrl = "https://app.saasplatform.com/settings/billing",
  gracePeriodEnd = "May 27, 2026",
}: PaymentFailedEmailProps) {
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
                    <strong style={styles.alertTitle}>Payment Action Required</strong>
                    <p style={styles.alertDesc}>
                      We were unable to process your recurring payment of {amount} for the {planName} plan.
                    </p>
                  </div>
                </div>

                <h1 style={styles.heading}>Hi {name},</h1>
                <p style={styles.text}>
                  This is a quick notification to let you know that your subscription billing attempt has failed. This could be due to an expired card, insufficient funds, or a block from your bank.
                </p>

                <p style={styles.text}>
                  To prevent any service interruption, please review and update your payment method. We will keep your Premium features active until <strong style={{ color: "#ef4444" }}>{gracePeriodEnd}</strong>, after which your account will automatically downgrade to the Free plan.
                </p>

                {/* Divider */}
                <div style={styles.divider} />

                {/* Summary Table */}
                <h3 style={styles.sectionTitle}>Failed Transaction Details</h3>
                <table style={styles.summaryTable}>
                  <tr>
                    <td style={styles.tableLabel}>Plan Tier</td>
                    <td style={styles.tableValue}>{planName}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableLabel}>Amount Due</td>
                    <td style={styles.tableValue}>{amount}</td>
                  </tr>
                  <tr>
                    <td style={styles.tableLabel}>Grace Period Expiry</td>
                    <td style={styles.tableValue}>{gracePeriodEnd}</td>
                  </tr>
                </table>

                {/* Divider */}
                <div style={styles.divider} />

                {/* CTA Button */}
                <table style={styles.buttonContainer}>
                  <tr>
                    <td align="center">
                      <a href={updateBillingUrl} target="_blank" rel="noopener noreferrer" style={styles.button}>
                        Update Payment Method
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
                  This is an automated billing notification regarding your Antigravity SaaS subscription.<br />
                  © 2026 Antigravity Inc, 100 Pine Street, San Francisco, CA.
                </p>
                <p style={styles.footerText}>
                  <a href="#" style={styles.footerLink}>Billing Help</a> • <a href="#" style={styles.footerLink}>Support Portal</a>
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
    color: "#ef4444",
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
    backgroundColor: "#271212",
    border: "1px solid #7f1d1d",
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
    color: "#fca5a5",
    marginBottom: "4px",
  },
  alertDesc: {
    fontSize: "13px",
    color: "#f87171",
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
  sectionTitle: {
    fontSize: "12px",
    fontWeight: "800" as const,
    textTransform: "uppercase" as const,
    color: "#f87171",
    letterSpacing: "1px",
    margin: "0 0 16px 0",
  },
  summaryTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  tableLabel: {
    padding: "10px 0",
    fontSize: "13px",
    color: "#71717a",
    borderBottom: "1px solid #1f1f23",
  },
  tableValue: {
    padding: "10px 0",
    fontSize: "13px",
    fontWeight: "600" as const,
    color: "#fafafa",
    textAlign: "right" as const,
    borderBottom: "1px solid #1f1f23",
  },
  buttonContainer: {
    width: "100%",
    margin: "24px 0",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#ef4444",
    border: "1px solid #f87171",
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

export default PaymentFailedEmail;

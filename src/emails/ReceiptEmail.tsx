interface ReceiptEmailProps {
  name?: string;
  amount: number;
  planName: string;
  receiptId: string;
}

export function ReceiptEmail({ name, amount, planName, receiptId }: ReceiptEmailProps) {
  const containerStyle: React.CSSProperties = {
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#fafafa",
    padding: "40px 20px",
    color: "#1f2937",
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: "580px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "32px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  };

  const receiptTableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "24px",
  };

  const tableHeaderStyle: React.CSSProperties = {
    textAlign: "left",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "8px",
    fontWeight: "bold",
  };

  const tableCellStyle: React.CSSProperties = {
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 16px 0" }}>
          Payment Receipt
        </h1>
        <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
          Hi {name || "there"},
        </p>
        <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
          This email serves as a receipt for your subscription to AI SaaS Boilerplate Pro.
        </p>

        <table style={receiptTableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Description</th>
              <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableCellStyle}>{planName} Subscription</td>
              <td style={{ ...tableCellStyle, textAlign: "right" }}>${(amount / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ ...tableCellStyle, fontWeight: "bold" }}>Total Paid</td>
              <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: "bold" }}>${(amount / 100).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "24px" }}>
          Receipt ID: {receiptId}
        </p>

        <hr style={{ border: "0", borderTop: "1px solid #e5e7eb", margin: "32px 0" }} />
        <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>
          If you have any questions regarding this charge, please contact support.
        </p>
      </div>
    </div>
  );
}

export default ReceiptEmail;

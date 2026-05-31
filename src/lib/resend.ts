import { Resend } from "resend";
import React from 'react';
import { env } from "./env";
import { db } from "./db";
import { logger } from "./logger";
import * as Sentry from "@sentry/nextjs";
import { EmailStatus } from "@prisma/client";

export const resend = new Resend(env.RESEND_API_KEY);

/**
 * Renders any React component with props to HTML, sends via Resend,
 * and tracks the operation outcomes inside the EmailLog table.
 */
export async function sendTransactionalEmail<P extends Record<string, unknown>>(
  to: string,
  subject: string,
  ReactComponent: React.ComponentType<P>,
  props: P
) {
  const templateName = ReactComponent.name || "EmailTemplate";
  let html = "";
  
  try {
    // Render the React template component to a static HTML payload
    const { renderToString } = await import("react-dom/server");
    html = renderToString(React.createElement(ReactComponent, props as P));
   
  } catch (renderError: unknown) {
    const message = renderError instanceof Error ? renderError.message : "Unknown error";
    logger.error(
      { err: renderError, to, subject, templateName },
      "Failed to serialize email template into HTML"
    );
    Sentry.captureException(renderError);
    throw new Error(`Email serialization failed: ${message}`);
  }

  try {
    // Send email via Resend SDK
    // In development/test, we fallback to default sandbox address if env is unconfigured
    const from = env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const emailResult = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message || "Resend API returned send error");
    }

    // Record success log
    await db.emailLog.create({
      data: {
        to,
        subject,
        template: templateName,
        status: EmailStatus.SENT,
      },
    });

    logger.info({ to, subject, templateName }, "Email dispatched and logged successfully");
    return { success: true, id: emailResult.data?.id };
   
  } catch (sendError: unknown) {
    const sendMessage = sendError instanceof Error ? sendError.message : "Unknown transport error during send";
    logger.error(
      { err: sendError, to, subject, templateName },
      "Resend email dispatch transaction failed"
    );

    // Record failed log record
    try {
      await db.emailLog.create({
        data: {
          to,
          subject,
          template: templateName,
          status: EmailStatus.FAILED,
          error: sendMessage,
        },
      });
    } catch (dbError) {
      logger.error({ dbError }, "Failed to write email error logs to database");
    }

    // Capture event in Sentry for telemetry alerts
    Sentry.captureException(sendError, {
      extra: { to, subject, templateName, props },
    });

    return { success: false, error: sendMessage };
  }
}

export default resend;

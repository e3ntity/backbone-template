/**
 * This file only contains a stub for sending emails.
 * You need to hook it up to an email API.
 */

import * as config from "@root/config";
import logger from "./logger";

type SendEmailParams = { html: string; recipient: string; subject: string; text: string };

export const sendEmail = async ({ recipient, subject, text }: SendEmailParams) =>
  logger.info(`${recipient} (email)> ${subject}\n${text}`);

const makeVerificationEmail = ({ code }: { code: string }) => ({
  subject: "Your verification code",
  text: `Verify your email address
  
  Please use the code below to verify that this email address belongs to you.

  Verification code

  ${code}

  ---
  
  If you did not request this email, you can disregard it. This message was distributed by ${config.DOMAIN}.
  `,
  html: `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <style>
      html, body { background-color: #f0f2f3; font-family: sans-serif; margin: 0; padding: 10px 0; }
      a { color: #3255D1; }
      p { color: #444; font-size: 14px; margin: 0; padding: 10px 30px; }
      .wrapper { background-color: #fff; margin: 0 auto; max-width: 600px; padding: 20px 0; }
      .black { color: #000 }
      .bold { font-weight: bold; }
      .border { border-bottom: 2px solid #f0f2f3; }
      .center { text-align: center; }
      .gray { color: #666 }
      .large { font-size: 21px; }
      .logo { margin: 0 auto; width: 60px; }
      .small-gap { padding: 5px 30px; }
      </style>
    </head>
    <body>
      <div class="border wrapper">
        <p class="black bold large">Verify your email address</p>
        <p>Please use the code below to verify that this email address belongs to you.</p>
        <p class="black bold center small-gap">Verification code</p>
        <p class="black bold center large small-gap">${code}</p>
      </div>
      <div class="wrapper">
        <p class="gray">If you did not request this email, you can disregard it. This message was distributed by <a href="https://${config.DOMAIN}">${config.DOMAIN}</a>.</p>
      </div>
    </body>
  </html>`,
});

type SendVerificationEmailParams = { code: string; to: string };

export const sendVerificationEmail = async ({ code, to }: SendVerificationEmailParams) =>
  await sendEmail({ recipient: to, ...makeVerificationEmail({ code }) });

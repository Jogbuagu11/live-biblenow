// Note: Resend is typically used server-side for security
// This is a client-side wrapper that calls your backend API

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  // This should call your backend API endpoint that uses Resend
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send email');
  }
  
  return await response.json();
};

// Common email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to TMWY',
    html: `
      <h1>Welcome to TMWY, ${name}!</h1>
      <p>Thank you for joining Take Me With You. We're here to help you when you can't be there.</p>
    `,
    text: `Welcome to TMWY, ${name}! Thank you for joining Take Me With You.`,
  }),
  
  standInRequest: (eventDetails: string) => ({
    subject: 'New Stand-In Request',
    html: `
      <h1>New Stand-In Request</h1>
      <p>You have a new stand-in request:</p>
      <p>${eventDetails}</p>
    `,
    text: `New Stand-In Request: ${eventDetails}`,
  }),
  
  standInAccepted: (standInName: string) => ({
    subject: 'Stand-In Request Accepted',
    html: `
      <h1>Your Stand-In Request Has Been Accepted</h1>
      <p>${standInName} has accepted your stand-in request.</p>
    `,
    text: `Your Stand-In Request Has Been Accepted by ${standInName}`,
  }),
};


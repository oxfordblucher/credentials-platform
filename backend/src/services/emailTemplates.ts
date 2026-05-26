function layout(heading: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #111827;">
  <h2 style="font-size: 20px; margin: 0 0 16px;">${heading}</h2>
  <p style="line-height: 1.6; margin: 0 0 24px;">${body}</p>
  <p style="font-size: 12px; color: #9ca3af; margin: 0;">— CredPlat</p>
</body>
</html>`;
}

export const credentialRequired = (memberName: string, credentialName: string, teamName: string) =>
  layout(
    'New Credential Requirement',
    `Hi ${memberName}, you have a new credential requirement: <strong>${credentialName}</strong> is now required for the <strong>${teamName}</strong> team. Please log in and submit your credential.`,
  );

export const credentialSubmitted = (managerName: string, memberName: string, credentialName: string) =>
  layout(
    'New Credential Submission',
    `Hi ${managerName}, a new <strong>${credentialName}</strong> submission from <strong>${memberName}</strong> is awaiting your review. Please log in to verify or reject it.`,
  );

export const credentialVerified = (memberName: string, credentialName: string, expirationDate?: string) =>
  layout(
    'Credential Verified',
    `Hi ${memberName}, your <strong>${credentialName}</strong> credential has been verified and is now active.${expirationDate ? ` It expires on ${expirationDate}.` : ''}`,
  );

export const credentialRejected = (memberName: string, credentialName: string, rejectionReason: string, reviewNotes?: string) =>
  layout(
    'Credential Submission Rejected',
    `Hi ${memberName}, your <strong>${credentialName}</strong> submission was rejected. Reason: ${rejectionReason}.${reviewNotes ? ` Notes: ${reviewNotes}.` : ''} Please resubmit with the correct documentation.`,
  );

export const credentialRevoked = (memberName: string, credentialName: string, reason: string) =>
  layout(
    'Credential Revoked',
    `Hi ${memberName}, your <strong>${credentialName}</strong> credential has been revoked. Reason: ${reason}. Please contact your team manager for more information.`,
  );

export const credentialExpiring = (memberName: string, credentialName: string, daysUntilExpiry: number) =>
  layout(
    'Credential Expiring Soon',
    `Hi ${memberName}, your <strong>${credentialName}</strong> credential expires in <strong>${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}</strong>. Please submit an updated credential before it expires.`,
  );

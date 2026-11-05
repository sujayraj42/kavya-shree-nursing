'use strict';

/**
 * Enterprise Audit Logger for administrative operations.
 * Logs structured security events: who (admin id, email, role), what (action, entity, target), when (ISO timestamp), and client IP.
 */
function logAdminAction({ admin, action, targetType, targetId = null, details = {}, ip = 'unknown' }) {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    event: 'ADMIN_AUDIT',
    admin: {
      id: admin?.id || admin?._id || 'unknown',
      email: admin?.email || 'unknown',
      role: admin?.role || 'unknown'
    },
    action,
    targetType,
    targetId: targetId ? String(targetId) : null,
    details,
    ip
  };

  // Structured log output for SIEM / observability drains
  console.log(
    `[AUDIT] ${auditEntry.timestamp} | ${auditEntry.admin.email} (${auditEntry.admin.role}) | ACTION: ${action} | TARGET: ${targetType}:${targetId || 'N/A'} | IP: ${ip}`
  );

  return auditEntry;
}

module.exports = {
  logAdminAction
};

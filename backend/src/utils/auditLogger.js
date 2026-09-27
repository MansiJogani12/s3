import AuditLog from '../models/AuditLog.js';

export const logAuditEvent = async ({
  actor = null,
  action,
  targetEntity = '',
  targetId = '',
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      : '';

    await AuditLog.create({
      actorId: actor ? actor._id || actor.id : null,
      actorRole: actor ? actor.role : 'SYSTEM',
      actorName: actor ? actor.name : 'System',
      action,
      targetEntity,
      targetId: String(targetId),
      details,
      ipAddress,
    });
  } catch (error) {
    console.error(`[AuditLog Error]: Failed to record event ${action}:`, error.message);
  }
};

const { EventEmitter } = require('events');

const bus = new EventEmitter();
let io = null;

function setSocketServer(socketServer) {
  io = socketServer;
}

function emitNotificationEvent(notification) {
  bus.emit('notification', notification);
  if (!io) return;

  const payload = {
    _id: notification._id,
    userId: notification.userId,
    profileId: notification.profileId || null,
    contentId: notification.contentId || null,
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt,
  };

  io.to(`user:${String(notification.userId)}`).emit('notification:new', payload);
  if (notification.profileId) {
    io.to(`profile:${String(notification.profileId)}`).emit('notification:new', payload);
  }
}

function subscribeNotification(listener) {
  bus.on('notification', listener);
  return () => {
    bus.off('notification', listener);
  };
}

module.exports = {
  setSocketServer,
  emitNotificationEvent,
  subscribeNotification,
};

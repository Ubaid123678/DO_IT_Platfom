export const socketService = {
  getIO: () => ({
    emit: (..._args: unknown[]) => undefined,
    on: (..._args: unknown[]) => undefined,
    off: (..._args: unknown[]) => undefined,
  }),
  connect: () => {
    // TODO: integrate socket.io client
  },
  disconnect: () => {
    // TODO: integrate socket.io client
  },
};

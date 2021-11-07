export const eventEmmiter = async (io, eventName, data) => {
  try {
    io.emit(eventName, data);
  } catch (e) {
    console.error(e);
  }
};

export const createUpdateModalSubmitHandler = ({
  onClose = () => {},
  onUpdate = async () => ({ ok: false }),
}) => {
  return async () => {
    const result = await onUpdate();
    if (result?.ok) {
      onClose();
    }
    return result;
  };
};

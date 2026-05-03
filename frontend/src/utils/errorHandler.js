const getErrorMessage = (error) => {
  return (
    error?.response?.data?.error || error?.message || "Une erreur est survenue"
  );
};

export default getErrorMessage;

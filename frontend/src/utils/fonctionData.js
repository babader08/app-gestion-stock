export const formatDate = (date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export const formatValue = (val, isCurrency = false, isLoading, isError) => {
  if (isLoading) return "...";
  if (isError) return "Erreur";
  const formatted = new Intl.NumberFormat("fr-FR").format(val || 0);
  return isCurrency ? `${formatted} F` : formatted;
};

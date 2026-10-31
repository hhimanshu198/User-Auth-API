export const roleName = (roleId) => {
  if (Number(roleId) === 1) return "Admin";
  if (Number(roleId) === 2) return "User";
  return `Role ${roleId || "Unknown"}`;
};

export const money = (value) => {
  const number = Number(value || 0);
  return `$${number.toFixed(4)}`;
};

export const number = (value) => {
  return Number(value || 0).toLocaleString("en-IN");
};

export const percentage = (used, limit) => {
  const usedNumber = Number(used || 0);
  const limitNumber = Number(limit || 0);
  if (!limitNumber) return 0;
  return Math.min(Math.round((usedNumber / limitNumber) * 100), 100);
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

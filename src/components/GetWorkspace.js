export const getWorkspaceId = () => {
  try {
    if (typeof window === "undefined") return 1;

    const fromLocal = window.localStorage?.getItem("id_workspace");
    const fromSession = window.sessionStorage?.getItem("id_workspace");

    const raw = fromLocal ?? fromSession ?? "1";
    const num = Number(raw);

    return Number.isFinite(num) && num > 0 ? num : 1;
  } catch {
    return 1;
  }
};

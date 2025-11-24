import React, { useEffect, useMemo, useRef, useState } from "react";
import Mobile from "./Layout/Mobile";
import { useAlert } from "@/hooks/useAlert";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom"; // ✅ untuk Enter → /dashboard
import DeletePopup from "@/components/Delete";

/* ========== API CONFIG ========== */
const API_URL = "/api/workspaces"; // route workspace (supabase)
const API_USER_ME = "/api/index"; // route untuk ambil user (id_user)

/* ========== Helper: fetch JSON aman ========== */
async function fetchJsonSafe(input, init) {
  const res = await fetch(input, init);
  const contentType = res.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");

  if (res.status === 204) return { res, data: null };

  const text = await res.text();
  if (!text) return { res, data: null };

  if (isJSON) {
    try {
      return { res, data: JSON.parse(text) };
    } catch (e) {
      throw new Error(
        `Invalid JSON from server (status ${res.status}). Body: "${text.slice(
          0,
          120
        )}..."`
      );
    }
  }
  return { res, data: text };
}

/* ========== Fallback dari localStorage (id_user INT8) ========== */
const getCurrentUserIdFromLocal = () => {
  try {
    const id = localStorage.getItem("id_user");
    if (id !== null && id !== undefined && id !== "") {
      return Number(id);
    }

    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (user && user.id_user !== undefined && user.id_user !== null) {
        return Number(user.id_user);
      }
    }

    return null;
  } catch {
    return null;
  }
};

/* ========== Ambil id_user dari /api/index (INT8) ========== */
async function getUserIdFromApi() {
  const { res, data } = await fetchJsonSafe(API_USER_ME, { method: "GET" });
  if (!res.ok) {
    throw new Error(
      typeof data === "string" ? data : `Failed to fetch user: ${res.status}`
    );
  }

  let raw = null;
  if (data && typeof data === "object") {
    if (data.id_user !== undefined && data.id_user !== null) {
      raw = data.id_user;
    } else if (data.data && data.data.id_user !== undefined) {
      raw = data.data.id_user;
    } else if (Array.isArray(data) && data[0]?.id_user !== undefined) {
      raw = data[0].id_user;
    }
  }

  if (raw === null || raw === undefined) return null;

  const num = Number(raw);
  return Number.isNaN(num) ? null : num;
}

export default function Workspaces() {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) return <Mobile />;
  return <GradiaWorkspacePage />;
}

/* ========== Desktop Page ========== */
function GradiaWorkspacePage() {
  const vw = (px) => `calc(${(px / 1440) * 100}vw)`;
  const vh = (px) => `calc(${(px / 768) * 100}vh)`;

  const DRAWER_W = 694;
  const PAD_X = 77;
  const TOP_HEADER = 100;
  const BORDER_GRADIENT =
    "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 100%)";

  const FOOTER_OFFSET = 81;
  const FOOTER_H = 24;
  const BOTTOM_SPACER = FOOTER_OFFSET + FOOTER_H + 12;

  const gradientText = {
    background: "linear-gradient(180deg,#FAFAFA 0%, #949494 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  const { showAlert } = useAlert();
  const navigate = useNavigate(); // ✅

  /* ====== STATE ====== */
  const [currentUserId, setCurrentUserId] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetWs, setTargetWs] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");

  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState("");

  const [createLoading, setCreateLoading] = useState(false); // ⭐ NEW: loading untuk Add
  // (hapus deleteLoading, nggak perlu kalau cuma optimistic)

  const pageRef = useRef(null);
  const createRowRef = useRef(null);

  /* ====== bootstrap: ambil id_user dari API, fallback localStorage ====== */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const idApi = await getUserIdFromApi();
        if (!cancelled) {
          if (idApi !== null) {
            setCurrentUserId(idApi);
          } else {
            const fallback = getCurrentUserIdFromLocal();
            setCurrentUserId(fallback ?? null);
          }
        }
      } catch {
        const fallback = getCurrentUserIdFromLocal();
        if (!cancelled) setCurrentUserId(fallback ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ====== Fetch list workspace setelah id_user diketahui ====== */
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsLoading(true);
      try {
        const effectiveUserId =
          currentUserId != null
            ? Number(currentUserId)
            : getCurrentUserIdFromLocal();

        const qs = effectiveUserId
          ? `?id_user=${encodeURIComponent(effectiveUserId)}`
          : "";

        const { res, data } = await fetchJsonSafe(`${API_URL}${qs}`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch: ${res.status}${
              typeof data === "string" ? ` • ${data.slice(0, 80)}` : ""
            }`
          );
        }

        let rows = [];
        if (Array.isArray(data)) {
          rows = data;
        } else if (data && Array.isArray(data.data)) {
          rows = data.data;
        } else if (data && Array.isArray(data.workspaces)) {
          rows = data.workspaces;
        }

        const filtered =
          effectiveUserId != null
            ? rows.filter(
                (row) =>
                  row.id_user !== null &&
                  row.id_user !== undefined &&
                  Number(row.id_user) === Number(effectiveUserId)
              )
            : rows;

        const mapped = filtered.map((w) => ({
          id: w.id_workspace ?? w.id ?? w.id_workspace_id ?? Math.random(),
          name: w.name ?? w.nama ?? w.workspace_name ?? "Untitled",
          __raw: w,
        }));
        setWorkspaces(mapped);
      } catch (err) {
        showAlert({
          icon: "ri-error-warning-fill",
          title: "Failed to load workspaces",
          desc: String(err?.message || err),
          variant: "destructive",
          width: 676,
          height: 380,
          duration: 2200,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  /* ====== Close dropdown + cancel create on outside click ====== */
  useEffect(() => {
    function onDocClick(e) {
      if (!pageRef.current) return;

      if (!pageRef.current.contains(e.target)) {
        setOpenMenuId(null);
        if (createMode) {
          setCreateMode(false);
          setCreateName("");
        }
        return;
      }

      if (
        createMode &&
        createRowRef.current &&
        !createRowRef.current.contains(e.target)
      ) {
        setCreateMode(false);
        setCreateName("");
      }

      if (openMenuId !== null) {
        const insideDropdown = e.target.closest(".workspace-dropdown");
        const onTrigger = e.target.closest(".workspace-more-trigger");
        if (!insideDropdown && !onTrigger) {
          setOpenMenuId(null);
        }
      }
    }

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [createMode, openMenuId]);

  // ✅ Enter: ke dashboard milik workspace (pakai id_workspace)
  const onEnter = (ws) => {
    const rawId = ws.__raw?.id_workspace ?? ws.id;
    const numericId = Number(rawId);
    const id_workspace = Number.isNaN(numericId) ? rawId : numericId;

    // simpan id_workspace di local & session (sebagai string angka)
    try {
      if (!Number.isNaN(Number(id_workspace))) {
        localStorage.setItem("id_workspace", String(id_workspace));
        sessionStorage.setItem("id_workspace", String(id_workspace));
      }
    } catch {}

    // simpan info workspace aktif
    try {
      localStorage.setItem(
        "current_workspace",
        JSON.stringify({
          id_workspace,
          name: ws.name,
        })
      );
    } catch {}

    navigate("/dashboard");
  };

  /* ====== Handlers ====== */
  const startEdit = (ws) => {
    setEditingId(ws.id);
    setDraftName(ws.name);
    setOpenMenuId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName("");
  };

  const saveEdit = async (id) => {
    const next = draftName.trim();
    if (!next) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Workspace name is required",
        desc: "Please enter a workspace name before saving.",
        variant: "destructive",
        width: 676,
        height: 380,
        duration: 2000,
      });
      return;
    }

    const prevName = workspaces.find((w) => w.id === id)?.name;

    try {
      const target = workspaces.find((w) => w.id === id);
      const id_workspace = target?.__raw?.id_workspace ?? id;

      const { res, data } = await fetchJsonSafe(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_workspace, name: next }),
      });

      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && data.error) ||
          (typeof data === "string" ? data : "") ||
          `Failed to update: ${res.status}`;
        throw new Error(msg);
      }

      setWorkspaces((prev) =>
        prev.map((w) => (w.id === id ? { ...w, name: next } : w))
      );
      setEditingId(null);
      setDraftName("");

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Workspace updated",
        desc:
          prevName && prevName !== next
            ? `"${prevName}" → "${next}"`
            : "Changes saved successfully.",
        variant: "success",
        width: 676,
        height: 380,
        duration: 2000,
      });
    } catch (err) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Update failed",
        desc: String(err?.message || err),
        variant: "destructive",
        width: 676,
        height: 380,
        duration: 2200,
      });
    }
  };

  const askDelete = (ws) => {
    setTargetWs(ws);
    setShowConfirm(true);
    setOpenMenuId(null);
  };

  // ⭐ NEW: delete sekarang optimistic — popup langsung tutup, row langsung hilang
  const handleDelete = async () => {
    if (!targetWs) return;

    const ws = targetWs;
    setShowConfirm(false);
    setTargetWs(null);

    // hilangkan dari UI dulu (optimistic)
    setWorkspaces((prev) => prev.filter((w) => w.id !== ws.id));

    try {
      const id_workspace = ws?.__raw?.id_workspace ?? ws.id;

      const { res, data } = await fetchJsonSafe(API_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_workspace }),
      });

      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && data.error) ||
          (typeof data === "string" ? data : "") ||
          `Failed to delete: ${res.status}`;
        throw new Error(msg);
      }

      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Workspace deleted",
        desc: `Workspace "${ws.name}" has been deleted successfully.`,
        variant: "success",
        width: 676,
        height: 380,
        duration: 2000,
      });
    } catch (err) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Delete failed",
        desc: String(err?.message || err),
        variant: "destructive",
        width: 676,
        height: 380,
        duration: 2200,
      });
    }
  };

  const startCreate = () => {
    setCreateMode(true);
    setCreateName("");
  };

  const commitCreate = async () => {
    const name = createName.trim();
    if (!name) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Workspace name is required",
        desc: "Please enter a workspace name before creating.",
        variant: "destructive",
        width: 676,
        height: 380,
        duration: 2000,
      });
      return;
    }

    if (!currentUserId) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "User not detected",
        desc: "User ID is required to create a workspace. Please re-login.",
        variant: "destructive",
        width: 676,
        height: 380,
        duration: 2200,
      });
      return;
    }

    setCreateLoading(true); // ⭐ NEW: mulai loading "Adding..."
    try {
      const payload = {
        name,
        id_user: Number(currentUserId),
      };

      const { res, data } = await fetchJsonSafe(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && data.error) ||
          (typeof data === "string" ? data : "") ||
          `Failed to create: ${res.status}`;
        throw new Error(msg);
      }

      const body = data && typeof data === "object" ? data : {};
      const created = Array.isArray(body.data)
        ? body.data[0]
        : body.data ?? {};

      const mapped = {
        id: created.id_workspace ?? created.id ?? Math.random(),
        name: created.name ?? name,
        __raw: created,
      };
      setWorkspaces((prev) => [...prev, mapped]);
      setCreateMode(false);
      setCreateName("");

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Workspace created",
        desc: `Workspace "${mapped.name}" has been created successfully.`,
        variant: "success",
        width: 676,
        height: 380,
        duration: 2000,
      });
    } catch (err) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Create failed",
        desc: String(err?.message || err),
        variant: "destructive",
        width: 676,
        height: 380,
        duration: 2200,
      });
    } finally {
      setCreateLoading(false); // ⭐ NEW: matikan loading
    }
  };

  const cancelCreate = () => {
    setCreateMode(false);
    setCreateName("");
  };

  const totalRows = workspaces.length + 1;
  const isScrollable = totalRows > 4;
  const ROW_AREA_MAX_HEIGHT = 292; // tinggi viewport 4 row

  const SKELETON_COUNT = 4;

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black text-white scrollbar-hide"
      ref={pageRef}
    >
      {/* === style untuk shimmer loading === */}
      <style>
        {`
          @keyframes gradia-shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .gradia-shimmer {
            background: linear-gradient(
              90deg,
              #141414 0%,
              #2a2a2a 50%,
              #141414 100%
            );
            background-size: 200% 100%;
            animation: gradia-shimmer 1.2s linear infinite;
          }
        `}
      </style>

      {/* === BACKGROUND === */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img
          src="/Asset 1.svg"
          alt="Asset 1"
          className="absolute z-0"
          style={{
            width: vw(1224.58),
            height: vh(739.76),
            left: vw(0.13),
            top: vh(200),
            transform: "rotate(4deg)",
            opacity: 0.9,
          }}
        />
        <img
          src="/Asset 2.svg"
          alt="Asset 2"
          className="absolute z-10"
          style={{
            width: vw(526),
            height: vh(589),
            left: vw(456),
            bottom: vh(400),
            opacity: 1,
          }}
        />
        <img
          src="/Asset 4.svg"
          alt="Asset 3"
          className="absolute z-10"
          style={{
            width: vw(632),
            height: vh(538),
            right: vw(1125),
            top: vh(100),
            opacity: 0.9,
          }}
        />
      </div>

      {/* === CONTENT === */}
      <div className="relative z-20 flex h-full w-full">
        {/* LEFT SIDE – balik ke atas seperti sebelumnya */}
        <div className="flex h-full grow flex-col pt-[50px] pl-[52px]">
          <div
            className="inline-flex items-baseline gap-1 leading-none"
            style={{ fontFamily: "'Genos', sans-serif", fontWeight: 700 }}
          >
            <span className="text-[128px] tracking-tight text-[#9457FF]">
              GRA
            </span>
            <span className="text-[128px] tracking-tight text-white">
              DIA
            </span>
          </div>
        </div>

        {/* RIGHT DRAWER */}
        <aside
          className="h-full flex flex-col font-[Inter]"
          style={{
            width: vw(DRAWER_W),
            background: "rgba(255,255,255,0.10)",
            border: "1px solid transparent",
            borderImageSlice: 1,
            borderImageSource: BORDER_GRADIENT,
            borderRadius: "18px",
            backdropFilter: "blur(10px)",
            color: "#A3A3A3",
            paddingLeft: PAD_X,
            paddingRight: PAD_X,
            paddingTop: TOP_HEADER,
            paddingBottom: 0,
            position: "relative",
            minHeight: "100%",
          }}
        >
          {/* HEADER */}
          <header className="text-center mb-[48px]">
            <h1
              className="text-[48px] font-extrabold leading-tight mb-2"
              style={gradientText}
            >
              Welcome to <br /> Gradia Workspace
            </h1>
            <p className="text-[20px] leading-snug">
              Your personal space to plan, grow, and achieve more.
            </p>
          </header>

          {/* WORKSPACE LIST */}
          <div
            className="px-[16px] scrollbar-hide"
            style={{
              maxHeight: ROW_AREA_MAX_HEIGHT, // viewport fix 4 row
              overflowY: isScrollable ? "auto" : "hidden",
              paddingBottom: BOTTOM_SPACER,
            }}
          >
            <div className="space-y-[12px]">
              {isLoading ? (
                <>
                  {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                    <SkeletonRow key={idx} />
                  ))}
                </>
              ) : (
                <>
                  {workspaces.map((ws) => (
                    <WorkspaceRow
                      key={ws.id}
                      workspace={ws}
                      isMenuOpen={openMenuId === ws.id}
                      onToggleMenu={() =>
                        setOpenMenuId((v) => (v === ws.id ? null : ws.id))
                      }
                      onAskDelete={() => askDelete(ws)}
                      onStartEdit={() => startEdit(ws)}
                      onCancelEdit={cancelEdit}
                      isEditing={editingId === ws.id}
                      draftName={draftName}
                      setDraftName={setDraftName}
                      onSave={() => saveEdit(ws.id)}
                      onEnter={() => onEnter(ws)}
                    />
                  ))}

                  {/* Row Create */}
                  <div className="mt-[12px]">
                    <CreateNewRow
                      containerRef={createRowRef}
                      createMode={createMode}
                      name={createName}
                      setName={setCreateName}
                      onStart={startCreate}
                      onAdd={commitCreate}
                      onCancel={cancelCreate}
                      isSubmitting={createLoading} // ⭐ NEW
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          {/* <p
            className="text-[#B9B9B9] text-[16px] w-full text-center"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: FOOTER_OFFSET,
              zIndex: 30,
            }}
          >
            © 2025 Gradia. All rights reserved.
          </p> */}
        </aside>
      </div>

      {/* Delete Popup */}
      {showConfirm && targetWs && (
        <DeletePopup
          title="Delete Workspace"
          warning={`Are you sure you want to delete \"${targetWs.name}\"?`}
          onCancel={() => {
            setShowConfirm(false);
            setTargetWs(null);
          }}
          onDelete={handleDelete} // ⭐ NEW: langsung panggil handleDelete (popup nutup + row hilang)
        />
      )}
    </div>
  );
}

/* ====================== Item Row ====================== */
function WorkspaceRow({
  workspace,
  isMenuOpen,
  onToggleMenu,
  onAskDelete,
  onStartEdit,
  onCancelEdit,
  isEditing,
  draftName,
  setDraftName,
  onSave,
  onEnter,
}) {
  const initials = useMemo(() => {
    const parts = workspace.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [workspace.name]);

  const inputRef = useRef(null);
  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const bgClass =
    isEditing || isPressed || isHovered ? "bg-[#333131]" : "bg-[#141414]";

  return (
    <div
      className={`relative flex items-center w-full h-[64px] rounded-[12px] transition-colors cursor-pointer ${bgClass}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={() => {
        if (!isEditing) onEnter();
      }}
    >
      <div className="flex w-full items-center px-[21px]">
        {!isEditing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu();
            }}
            className="workspace-more-trigger inline-flex h-[35px] w-[35px] items-center justify-center cursor-pointer"
            title="More"
          >
            <i className="ri-more-2-line text-[22px] text-[#fafafa]" />
          </button>
        )}

        {!isEditing && (
          <span
            className="ml-[18.5px] inline-flex h-[35px] w-[42px] items-center justify-center rounded-md"
            style={{
              background: "linear-gradient(135deg, #141414 0%, #6A6A6A 100%)",
            }}
          >
            <span
              className="font-[Inter] font-semibold tracking-wide leading-none"
              style={{ lineHeight: 1, fontSize: 18, color: "#FAFAFA" }}
            >
              {initials}
            </span>
          </span>
        )}

        <div className={`${isEditing ? "ml-0" : "ml-[16px]"} text-[18px] flex-1`}>
          {isEditing ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancelEdit();
              }}
              className="w-full bg-transparent text-[#FAFAFA] placeholder-[#A3A3A3] outline-none ring-0 border-0"
              placeholder="New workspace name"
              style={{ fontSize: 18 }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-foreground">{workspace.name}</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-white cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
                border: "none",
                borderRadius: 8,
              }}
              title="Save"
            >
              <i className="ri-edit-line text-[16px]" />
              <span className="text-[16px] font-semibold">Save</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEnter();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-white cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
                border: "none",
                borderRadius: 8,
              }}
              title="Enter"
            >
              <span className="text-[16px] font-semibold">Enter</span>
              <i className="ri-login-circle-line text-[16px]" />
            </button>
          )}
        </div>
      </div>

      {!isEditing && isMenuOpen && (
        <div
          className="workspace-dropdown absolute top-[8px] left-[8px] z-30 w-[160px] rounded-[10px] overflow-hidden"
          style={{
            background: "#1c1c1c",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] text-[#FAFAFA] flex items-center gap-2 cursor-pointer"
            onClick={onStartEdit}
          >
            <i className="ri-edit-line" />
            Edit
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] text-[#FF8686] flex items-center gap-2 cursor-pointer"
            onClick={onAskDelete}
          >
            <i className="ri-delete-bin-fill" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ====================== Skeleton Row (Loading) ====================== */
function SkeletonRow() {
  return (
    <div className="relative flex items-center w-full h-[64px] rounded-[12px] overflow-hidden bg-[#141414]">
      <div className="absolute inset-0 gradia-shimmer" />
    </div>
  );
}

/* ====================== Create Row ====================== */
function CreateNewRow({
  containerRef,
  createMode,
  name,
  setName,
  onStart,
  onAdd,
  onCancel,
  isSubmitting, // ⭐ NEW
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const bgClass =
    createMode || isPressed || isHovered ? "bg-[#333131]" : "bg-[#141414]";

  const disabled = isSubmitting;

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center w-full h-[64px] rounded-[14px] text-left transition-colors cursor-pointer ${bgClass}`}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={() => {
        if (!createMode && !disabled) onStart();
      }}
      title={createMode ? undefined : "Create new workspace"}
    >
      <div className="flex w-full items-center px-[21px]">
        {!createMode && (
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: 37,
              height: 31,
              borderRadius: 4,
              background: "#393939",
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <i
              className="ri-add-line"
              style={{ fontSize: 23, lineHeight: 1, color: "#FAFAFA" }}
            />
          </span>
        )}

        <div
          className={`${createMode ? "ml-0" : "ml-[16px]"} text-[18px] flex-1`}
          style={{ color: "#A3A3A3" }}
        >
          {createMode ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) onAdd();
                if (e.key === "Escape" && !disabled) onCancel();
              }}
              className="w-full bg-transparent text-[#FAFAFA] placeholder-[#A3A3A3] outline-none ring-0 border-0"
              placeholder="Workspace name"
              style={{ fontSize: 18 }}
              autoFocus
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>Create new workspace</span>
          )}
        </div>

        {createMode && (
          <div className="ml-auto flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onAdd();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-white disabled:opacity-60 cursor-pointer"
              style={{
                background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
                border: "none",
                borderRadius: 8,
              }}
              title="Add"
              disabled={disabled}
            >
              <i className="ri-add-line text-[16px]" />
              <span className="text-[16px] font-semibold">
                {disabled ? "Adding..." : "Add"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

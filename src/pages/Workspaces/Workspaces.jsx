// src/pages/Workspaces/index.jsx
import React, { $1 } from "react";
import Mobile from "./Layout/Mobile";
import { useMediaQuery } from "react-responsive";
$1
// === API CONFIG ===
const API_URL = "/api/workspace"; // point this to your deployed API route

// If you already have auth, replace this with your real user-id source
const getCurrentUserId = () => {
  try {
    // example: persisted from your auth flow
    const v = localStorage.getItem("gradia_user_id");
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
};

export default function Workspaces() {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) return <Mobile />;
  return <GradiaWorkspacePage />;
}

// === Desktop page ===
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

  // ==== ALERTS ====
  const { showAlert } = useAlert();

  // ==== STATE ====
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  const [openMenuId, setOpenMenuId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetWs, setTargetWs] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");

  const [createMode, setCreateMode] = useState(false);
  const [createName, setCreateName] = useState("");

  const pageRef = useRef(null);
  const createRowRef = useRef(null);

  // Fetch list from API
  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsLoading(true);
      try {
        const id_user = getCurrentUserId();
        const qs = id_user ? `?id_user=${encodeURIComponent(id_user)}` : "";
        const res = await fetch(`${API_URL}${qs}`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        // map backend fields -> UI shape
        const mapped = (Array.isArray(data) ? data : []).map((w) => ({
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
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  // Close dropdown + create ketika klik di luar
  useEffect(() => {
    function onDocClick(e) {
      if (!pageRef.current) return;

      // Klik di luar keseluruhan page
      if (!pageRef.current.contains(e.target)) {
        setOpenMenuId(null);
        if (createMode) {
          setCreateMode(false);
          setCreateName("");
        }
        return;
      }

      // Klik di luar form create
      if (
        createMode &&
        createRowRef.current &&
        !createRowRef.current.contains(e.target)
      ) {
        setCreateMode(false);
        setCreateName("");
      }

      // Tutup dropdown jika klik bukan di dropdown & bukan di tombol trigger
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

  const onEnter = (name) => {
    // TODO: navigate ke halaman workspace yang dipilih
    console.log("Enter:", name);
  };

  // ==== handlers ====
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
      });
      return;
    }

    const prevName = workspaces.find((w) => w.id === id)?.name;

    try {
      // find raw id_workspace
      const target = workspaces.find((w) => w.id === id);
      const id_workspace = target?.__raw?.id_workspace ?? id;
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_workspace, name: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Failed to update: ${res.status}`);
      }

      setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, name: next } : w)));
      setEditingId(null);
      setDraftName("");

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Workspace updated",
        desc: prevName && prevName !== next ? `"${prevName}" → "${next}"` : "Changes saved successfully.",
        variant: "success",
        width: 676,
        height: 380,
      });
    } catch (err) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Update failed",
        desc: String(err?.message || err),
        variant: "destructive",
        width: 676,
        height: 380,
      });
    }
  };

  const askDelete = (ws) => {
    setTargetWs(ws);
    setShowConfirm(true);
    setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (!targetWs) return;
    try {
      const id_workspace = targetWs?.__raw?.id_workspace ?? targetWs.id;
      const res = await fetch(API_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_workspace }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Failed to delete: ${res.status}`);
      }

      setWorkspaces((prev) => prev.filter((w) => w.id !== targetWs.id));
      const deleted = targetWs;
      setTargetWs(null);

      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Workspace deleted",
        desc: `Workspace "${deleted.name}" has been deleted successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });
    } catch (err) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Delete failed",
        desc: String(err?.message || err),
        variant: "destructive",
        width: 676,
        height: 380,
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
      });
      return;
    }

    try {
      const id_user = getCurrentUserId();
      const payload = { name };
      if (id_user) payload.id_user = id_user;

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || `Failed to create: ${res.status}`);

      // API returns { message, data: [row] }
      const created = Array.isArray(j?.data) ? j.data[0] : j?.data ?? {};
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
      });
    } catch (err) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Create failed",
        desc: String(err?.message || err),
        variant: "destructive",
        width: 676,
        height: 380,
      });
    }
  };

  const cancelCreate = () => {
    setCreateMode(false);
    setCreateName("");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white" ref={pageRef}>
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
            transform: "rotate(-4deg)",
            opacity: 0.9,
          }}
        />
      </div>

      {/* === CONTENT === */}
      <div className="relative z-20 flex h-full w-full">
        {/* LEFT SIDE */}
        <div className="flex h-full grow flex-col pt-[50px] pl:[52px] pl-[52px]">
          <div
            className="inline-flex items-baseline gap-1 leading-none"
            style={{ fontFamily: "'Genos', sans-serif", fontWeight: 700 }}
          >
            <span className="text-[128px] tracking-tight text-[#9457FF]">GRA</span>
            <span className="text-[128px] tracking-tight text-white">DIA</span>
          </div>
          <p
            className="ml-2 mt-[-10px] font-[Inter] font-semibold leading-[1.2]"
            style={{ fontSize: 36 }}
          >
            <span
              style={{
                display: "inline-block",
                background: "linear-gradient(180deg, #FAFAFA 0%, #8B8B8B 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              Manage Smarter,
              <br />
              Achieve More
            </span>
          </p>
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
            <h1 className="text-[48px] font-extrabold leading-tight mb-2" style={gradientText}>
              Welcome to <br /> Gradia Workspace
            </h1>
            <p className="text-[20px] leading-snug">
              Your personal space to plan, grow, and achieve more.
            </p>
          </header>

          {/* WORKSPACE LIST */}
          <div className="px-[16px]">
            <div className="space-y-[12px]">
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
                  onEnter={() => onEnter(ws.name)}
                />
              ))}

              {/* GAP 12px dari item terakhir ke Create */}
              <div className="mt-[12px]">
                <CreateNewRow
                  containerRef={createRowRef}
                  createMode={createMode}
                  name={createName}
                  setName={setCreateName}
                  onStart={startCreate}
                  onAdd={commitCreate}
                  onCancel={cancelCreate}
                />
              </div>

              <div style={{ height: BOTTOM_SPACER }} />
            </div>
          </div>

          {/* Footer */}
          <p
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
          </p>
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
          onDelete={() => {
            setShowConfirm(false);
            handleDelete();
          }}
        />
      )}
    </div>
  );
}

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
        {/* More (dropdown trigger) — HILANG saat editing */}
        {!isEditing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMenu();
            }}
            className="workspace-more-trigger inline-flex h-[35px] w-[35px] items-center justify-center"
            title="More"
          >
            <i className="ri-more-2-line text-[22px] text-[#fafafa]" />
          </button>
        )}

        {/* Badge alias — HILANG saat editing */}
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

        {/* Name / Edit Field */}
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

        {/* Action button: Enter / Save */}
        <div className="ml-auto flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-white"
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
              onClick={(e) => {
                e.stopPropagation();
                onEnter();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-white"
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

      {/* Dropdown (tidak muncul saat editing) */}
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
            className="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] text-[#FAFAFA] flex items-center gap-2"
            onClick={onStartEdit}
          >
            <i className="ri-edit-line" />
            Edit
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-[#2a2a2a] text-[#FF8686] flex items-center gap-2"
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

function CreateNewRow({ containerRef, createMode, name, setName, onStart, onAdd, onCancel }) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const bgClass =
    createMode || isPressed || isHovered ? "bg-[#333131]" : "bg-[#141414]";

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center w-full h-[64px] rounded-[14px] text-left transition-colors cursor-pointer ${bgClass}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={() => {
        if (!createMode) onStart();
      }}
      title={createMode ? undefined : "Create new workspace"}
    >
      <div className="flex w-full items-center px-[21px]">
        {/* Kotak + dan ikon: HANYA muncul ketika BELUM createMode */}
        {!createMode && (
          <span
            className="inline-flex items-center justify-center"
            style={{
              width: 37,
              height: 31,
              borderRadius: 4,
              background: "#393939",
            }}
          >
            <i className="ri-add-line" style={{ fontSize: 23, lineHeight: 1, color: "#FAFAFA" }} />
          </span>
        )}

        {/* Label / Input */}
        <div className={`${createMode ? "ml-0" : "ml-[16px]"} text-[18px] flex-1`} style={{ color: "#A3A3A3" }}>
          {createMode ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAdd();
                if (e.key === "Escape") onCancel();
              }}
              className="w-full bg-transparent text-[#FAFAFA] placeholder-[#A3A3A3] outline-none ring-0 border-0"
              placeholder="Workspace name"
              style={{ fontSize: 18 }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>Create new workspace</span>
          )}
        </div>

        {/* Tombol Add */}
        {createMode && (
          <div className="ml-auto flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-white"
              style={{
                background: "linear-gradient(90deg, #34146C 0%, #28073B 100%)",
                border: "none",
                borderRadius: 8,
              }}
              title="Add"
            >
              <i className="ri-add-line text-[16px]" />
              <span className="text-[16px] font-semibold">Add</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

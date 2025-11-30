import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Mobile from "./Layout/Mobile";
import { useAlert } from "@/hooks/useAlert";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import DeletePopup from "@/components/Delete";

/* ========== API CONFIG ========== */
const API_URL = "/api/workspaces";
const API_USER_ME = "/api/index";

/* ========== Helper: fetch JSON aman ========== */
async function fetchJson(input, init) {
  const res = await fetch(input, init);
  const type = res.headers.get("content-type") || "";
  const isJSON = type.includes("application/json");

  if (res.status === 204) return { res, data: null };

  const text = await res.text();
  if (!text) return { res, data: null };

  if (isJSON) {
    try {
      return { res, data: JSON.parse(text) };
    } catch {
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
const getUidLocal = () => {
  try {
    const id = localStorage.getItem("id_user");
    if (id !== null && id !== undefined && id !== "") return Number(id);

    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u && u.id_user !== undefined && u.id_user !== null) {
        return Number(u.id_user);
      }
    }
    return null;
  } catch {
    // ignore localStorage error
    return null;
  }
};

/* ========== Ambil id_user dari /api/index (INT8) ========== */
async function getUidApi() {
  const { res, data } = await fetchJson(API_USER_ME, { method: "GET" });
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

/* ========== Helper workspace id ========== */
const getWsId = (wsOrId) =>
  wsOrId?.__raw?.id_workspace ?? wsOrId.id_workspace ?? wsOrId.id ?? wsOrId;

export default function Workspaces() {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) return <Mobile />;
  return <WsPage />;
}

/* ========== Desktop Page ========== */
function WsPage() {
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

  const textGrad = {
    background: "linear-gradient(180deg,#FAFAFA 0%, #949494 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };

  const { showAlert } = useAlert();
  const nav = useNavigate();

  /* ====== STATE ====== */
  const [uid, setUid] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [menuId, setMenuId] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [selWs, setSelWs] = useState(null);

  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState("");

  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const pageRef = useRef(null);
  const createRef = useRef(null);

  /* ====== bootstrap: ambil id_user dari API, fallback localStorage ====== */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const idApi = await getUidApi();
        if (!cancelled) {
          if (idApi !== null) {
            setUid(idApi);
          } else {
            const fb = getUidLocal();
            setUid(fb ?? null);
          }
        }
      } catch {
        const fb = getUidLocal();
        if (!cancelled) setUid(fb ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ====== Fetch list workspace setelah id_user diketahui ====== */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const effUid = uid != null ? Number(uid) : getUidLocal();
        const qs = effUid ? `?id_user=${encodeURIComponent(effUid)}` : "";

        const { res, data } = await fetchJson(`${API_URL}${qs}`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch: ${res.status}${
              typeof data === "string" ? ` • ${data.slice(0, 80)}` : ""
            }`
          );
        }

        let rows = [];
        if (Array.isArray(data)) rows = data;
        else if (data && Array.isArray(data.data)) rows = data.data;
        else if (data && Array.isArray(data.workspaces)) rows = data.workspaces;

        const filtered =
          effUid != null
            ? rows.filter(
                (r) =>
                  r.id_user !== null &&
                  r.id_user !== undefined &&
                  Number(r.id_user) === Number(effUid)
              )
            : rows;

        const mapped = filtered.map((w) => ({
          id: getWsId(w) ?? Math.random(),
          name: w.name ?? w.nama ?? w.workspace_name ?? "Untitled",
          __raw: w,
        }));
        setList(mapped);
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
        setLoading(false);
      }
    };

    load();
  }, [uid]);

  /* ====== Close dropdown + cancel create on outside click ====== */
  useEffect(() => {
    const handleClick = (e) => {
      if (!pageRef.current) return;

      if (!pageRef.current.contains(e.target)) {
        setMenuId(null);
        if (createMode) {
          setCreateMode(false);
          setNewName("");
        }
        return;
      }

      if (
        createMode &&
        createRef.current &&
        !createRef.current.contains(e.target)
      ) {
        setCreateMode(false);
        setNewName("");
      }

      if (menuId !== null) {
        const inside = e.target.closest(".workspace-dropdown");
        const trigger = e.target.closest(".workspace-more-trigger");
        if (!inside && !trigger) setMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [createMode, menuId]);

  // ✅ Enter: ke dashboard milik workspace (pakai id_workspace)
  const handleEnter = (ws) => {
    const id_workspace = getWsId(ws);
    try {
      if (!Number.isNaN(Number(id_workspace))) {
        localStorage.setItem("id_workspace", String(id_workspace));
        sessionStorage.setItem("id_workspace", String(id_workspace));
      }
    } catch {
      // ignore storage error
    }

    try {
      localStorage.setItem(
        "current_workspace",
        JSON.stringify({
          id_workspace,
          name: ws.name,
        })
      );
    } catch {
      // ignore storage error
    }

    nav("/dashboard");
  };

  /* ====== Handlers ====== */
  const startEdit = (ws) => {
    setEditId(ws.id);
    setDraft(ws.name);
    setMenuId(null);
  };

  const cancelEdit = () => {
    setEditId(null);
    setDraft("");
  };

  const saveEdit = async (id) => {
    const next = draft.trim();
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

    const prevName = list.find((w) => w.id === id)?.name;

    try {
      const target = list.find((w) => w.id === id);
      const id_workspace = getWsId(target ?? id);

      const { res, data } = await fetchJson(API_URL, {
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

      setList((prev) =>
        prev.map((w) => (w.id === id ? { ...w, name: next } : w))
      );
      setEditId(null);
      setDraft("");

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
    setSelWs(ws);
    setConfirm(true);
    setMenuId(null);
  };

  // delete optimistic — popup tutup, row hilang
  const handleDelete = async () => {
    if (!selWs) return;

    const ws = selWs;
    setConfirm(false);
    setSelWs(null);

    setList((prev) => prev.filter((w) => w.id !== ws.id));

    try {
      const id_workspace = getWsId(ws);

      const { res, data } = await fetchJson(API_URL, {
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
    setNewName("");
  };

  const cancelCreate = () => {
    setCreateMode(false);
    setNewName("");
  };

  const addWs = async () => {
    const name = newName.trim();
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

    if (!uid) {
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

    setSubmitting(true);
    try {
      const payload = { name, id_user: Number(uid) };

      const { res, data } = await fetchJson(API_URL, {
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
      setList((prev) => [...prev, mapped]);
      setCreateMode(false);
      setNewName("");

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
      setSubmitting(false);
    }
  };

  const totalRows = list.length + 1;
  const scroll = totalRows > 4;
  const ROW_AREA_MAX_HEIGHT = 292;
  const LOAD_COUNT = 4;

  return (
    <div
      ref={pageRef}
      className="relative h-screen w-screen overflow-hidden bg-black text-white scrollbar-hide"
    >
      {/* === style untuk loading box (dulu shimmer) === */}
      <style>
        {`
          @keyframes gradia-loading {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .gradia-loading {
            background: linear-gradient(
              90deg,
              #141414 0%,
              #2a2a2a 50%,
              #141414 100%
            );
            background-size: 200% 100%;
            animation: gradia-loading 1.2s linear infinite;
          }
        `}
      </style>

      {/* === BACKGROUND === */}
      <div className="pointer-events-none absolute inset-0 select-none">
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
        {/* LEFT SIDE */}
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
          className="flex h-full flex-col font-[Inter] text-[#A3A3A3] bg-white/10 rounded-[18px] border border-transparent backdrop-blur-[10px]"
          style={{
            width: vw(DRAWER_W),
            borderImageSlice: 1,
            borderImageSource: BORDER_GRADIENT,
            paddingLeft: PAD_X,
            paddingRight: PAD_X,
            paddingTop: TOP_HEADER,
            paddingBottom: 0,
            position: "relative",
            minHeight: "100%",
          }}
        >
          {/* HEADER */}
          <header className="mb-[48px] text-center">
            <h1
              className="mb-2 text-[48px] font-extrabold leading-tight"
              style={textGrad}
            >
              Welcome to <br /> Gradia Workspace
            </h1>
            <p className="text-[20px] leading-snug">
              Your personal space to plan, grow, and achieve more.
            </p>
          </header>

          {/* WORKSPACE LIST */}
          <div
            className="scrollbar-hide px-[16px]"
            style={{
              maxHeight: ROW_AREA_MAX_HEIGHT,
              overflowY: scroll ? "auto" : "hidden",
              paddingBottom: BOTTOM_SPACER,
            }}
          >
            <div className="space-y-[12px]">
              {loading ? (
                <>
                  {Array.from({ length: LOAD_COUNT }).map((_, idx) => (
                    <LoadingRow key={idx} />
                  ))}
                </>
              ) : (
                <>
                  {list.map((ws) => (
                    <Row
                      key={ws.id}
                      ws={ws}
                      menuOpen={menuId === ws.id}
                      toggleMenu={() =>
                        setMenuId((v) => (v === ws.id ? null : ws.id))
                      }
                      askDelete={() => askDelete(ws)}
                      startEdit={() => startEdit(ws)}
                      cancelEdit={cancelEdit}
                      editing={editId === ws.id}
                      draft={draft}
                      setDraft={setDraft}
                      save={() => saveEdit(ws.id)}
                      enter={() => handleEnter(ws)}
                    />
                  ))}

                  {/* Row Create */}
                  <div className="mt-[12px]">
                    <CreateRow
                      refEl={createRef}
                      active={createMode}
                      name={newName}
                      setName={setNewName}
                      start={startCreate}
                      add={addWs}
                      cancel={cancelCreate}
                      submitting={submitting}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer (tetap dikomentari agar tampilan sama) */}
          {/*
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
          */}
        </aside>
      </div>

      {/* Delete Popup */}
      {confirm && selWs && (
        <DeletePopup
          title="Delete Workspace"
          warning={`Are you sure you want to delete "${selWs.name}"?`}
          onCancel={() => {
            setConfirm(false);
            setSelWs(null);
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

/* ====================== Item Row ====================== */
function Row({
  ws,
  menuOpen,
  toggleMenu,
  askDelete,
  startEdit,
  cancelEdit,
  editing,
  draft,
  setDraft,
  save,
  enter,
}) {
  const initials = useMemo(() => {
    const parts = ws.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [ws.name]);

  const inputRef = useRef(null);
  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);

  const bg =
    editing || pressed || hover ? "bg-[#333131]" : "bg-[#141414]";

  return (
    <div
      className={`relative flex h-[64px] w-full cursor-pointer items-center rounded-[12px] transition-colors ${bg}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => {
        setPressed(false);
        setHover(false);
      }}
      onMouseEnter={() => setHover(true)}
      onClick={() => {
        if (!editing) enter();
      }}
    >
      <div className="flex w-full items-center px-[21px]">
        {!editing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu();
            }}
            className="workspace-more-trigger inline-flex h-[35px] w-[35px] cursor-pointer items-center justify-center"
            title="More"
          >
            <i className="ri-more-2-line text-[22px] text-[#fafafa]" />
          </button>
        )}

        {!editing && (
          <span
            className="ml-[18.5px] inline-flex h-[35px] w-[42px] items-center justify-center rounded-md"
            style={{
              background: "linear-gradient(135deg, #141414 0%, #6A6A6A 100%)",
            }}
          >
            <span
              className="font-[Inter] font-semibold leading-none tracking-wide"
              style={{ lineHeight: 1, fontSize: 18, color: "#FAFAFA" }}
            >
              {initials}
            </span>
          </span>
        )}

        <div className={`${editing ? "ml-0" : "ml-[16px]"} flex-1 text-[18px]`}>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") cancelEdit();
              }}
              className="w-full border-0 bg-transparent text-[#FAFAFA] outline-none ring-0 placeholder-[#A3A3A3]"
              placeholder="New workspace name"
              style={{ fontSize: 18 }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-foreground">{ws.name}</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {editing ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                save();
              }}
              className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-white"
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
                enter();
              }}
              className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-white"
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

      {!editing && menuOpen && (
        <div
          className="workspace-dropdown absolute left-[8px] top-[8px] z-30 w-[160px] overflow-hidden rounded-[10px]"
          style={{
            background: "#1c1c1c",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[#FAFAFA] hover:bg-[#2a2a2a]"
            onClick={startEdit}
          >
            <i className="ri-edit-line" />
            Edit
          </button>
          <button
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[#FF8686] hover:bg-[#2a2a2a]"
            onClick={askDelete}
          >
            <i className="ri-delete-bin-fill" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ====================== Loading Row (dulu Skeleton / shimmer) ====================== */
function LoadingRow() {
  return (
    <div className="relative flex h-[64px] w-full items-center overflow-hidden rounded-[12px] bg-[#141414]">
      <div className="gradia-loading absolute inset-0" />
    </div>
  );
}

/* ====================== Create Row ====================== */
function CreateRow({
  refEl,
  active,
  name,
  setName,
  start,
  add,
  cancel,
  submitting,
}) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);

  const bg =
    active || pressed || hover ? "bg-[#333131]" : "bg-[#141414]";

  const disabled = submitting;

  return (
    <div
      ref={refEl}
      className={`relative flex h-[64px] w-full cursor-pointer items-center rounded-[14px] text-left transition-colors ${bg}`}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => {
        setPressed(false);
        setHover(false);
      }}
      onMouseEnter={() => setHover(true)}
      onClick={() => {
        if (!active && !disabled) start();
      }}
      title={active ? undefined : "Create new workspace"}
    >
      <div className="flex w-full items-center px-[21px]">
        {!active && (
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
          className={`${active ? "ml-0" : "ml-[16px]"} flex-1 text-[18px]`}
          style={{ color: "#A3A3A3" }}
        >
          {active ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) add();
                if (e.key === "Escape" && !disabled) cancel();
              }}
              className="w-full border-0 bg-transparent text-[#FAFAFA] outline-none ring-0 placeholder-[#A3A3A3]"
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

        {active && (
          <div className="ml-auto flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) add();
              }}
              className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-white disabled:opacity-60"
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

/* ========== PropTypes (untuk hilangkan warning react/prop-types) ========== */
Row.propTypes = {
  ws: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    __raw: PropTypes.any,
  }).isRequired,
  menuOpen: PropTypes.bool.isRequired,
  toggleMenu: PropTypes.func.isRequired,
  askDelete: PropTypes.func.isRequired,
  startEdit: PropTypes.func.isRequired,
  cancelEdit: PropTypes.func.isRequired,
  editing: PropTypes.bool.isRequired,
  draft: PropTypes.string.isRequired,
  setDraft: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  enter: PropTypes.func.isRequired,
};

CreateRow.propTypes = {
  refEl: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  active: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  setName: PropTypes.func.isRequired,
  start: PropTypes.func.isRequired,
  add: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
};

LoadingRow.propTypes = {};

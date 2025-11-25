import { Button } from "@/components/Button";
import Logo from "@/components/Logo";
import Background from "@/pages/Auth/Login/components/Background";
import React, { useEffect, useState, useRef } from "react";
import Warning from "@/assets/svgs/warning.svg";
import { useNavigate } from "react-router-dom";

const Mobile = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const [addMode, setAddMode] = useState(false);
  const [popupIndex, setPopupIndex] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch(`/api/workspaces?id_user=${user.id_user}`);
        if (!res.ok) throw new Error("Failed to fetch workspaces");
        const data = await res.json();
        setWorkspaces(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if ((addMode || editMode !== null) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addMode, editMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        (addMode || editMode !== null) &&
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setAddMode(false);
        setEditMode(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [addMode, editMode]);

  const handleAdd = async () => {
    const name = inputRef.current?.value.trim();
    if (!name) return;
    setLoadingAdd(true);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_user: user.id_user, name }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Failed to create workspace");

      setWorkspaces((prev) => [...prev, result.data?.[0]]);
      setAddMode(false);
      inputRef.current.value = "";
    } catch (error) {
      console.error("Error creating workspace:", error);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleEdit = async (id_workspace) => {
    const name = inputRef.current?.value.trim();
    if (!name) return;
    setLoadingAdd(true);

    try {
      const res = await fetch(`/api/workspaces/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, id_workspace }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update");

      setWorkspaces((prev) =>
        prev.map((w) => (w.id_workspace === id_workspace ? result.data[0] : w))
      );
      setEditMode(null);
    } catch (error) {
      console.error("Error updating workspace:", error);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleDelete = async () => {
    setLoadingAdd(true);
    if (!selectedWorkspace) return;
    try {
      const res = await fetch("/api/workspaces", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_workspace: selectedWorkspace.id_workspace }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.error || "Failed to delete workspace");

      // Hapus dari state
      setWorkspaces((prev) =>
        prev.filter((w) => w.id_workspace !== selectedWorkspace.id_workspace)
      );
      setShowDeleteAlert(false);
      setSelectedWorkspace(null);
      setLoadingAdd(false);
    } catch (error) {
      console.error("Error deleting workspace:", error);
    }
  };

  const enterWorkspace = (idWorkspace) => {
    sessionStorage.setItem("id_workspace", idWorkspace);
    navigate("/dashboard");
  };

  return (
    <div className="text-foreground min-h-dvh relative flex flex-col">
      <Background />
      <Logo />

      {/* Modal Delete */}
      {showDeleteAlert && (
        <div className="w-full h-dvh bg-black/50 fixed top-0 left-0 flex justify-center items-center z-[99]">
          <div className="px-4 py-5 bg-[#15171A] gap-5 rounded-2xl flex flex-col w-[80%] max-w-[400px]">
            <p className="font-semibold text-[20px] text-center md:text-[24px]">
              Delete Workspace
            </p>
            <div className="px-4 py-4 w-full flex items-center flex-col gap-5 bg-gradient-to-t from-[#141414] to-[#070707] rounded-[12px]">
              <img src={Warning} alt="warning" className="w-[80px] h-[80px]" />
              <p className="font-semibold text-center w-[80%] md:text-[20px]">
                Are you sure you want to delete this workspace?
              </p>
              <span className="text-center w-[80%] text-foreground-secondary text-[14px] md:text-base">
                This action cannot be undone, and all related data will be
                permanently removed.
              </span>

              <div className="border-t border-border/50 pt-3 flex justify-end w-full gap-3 mt-2 md:mt-4">
                <button
                  onClick={() => {
                    setShowDeleteAlert(false);
                    setSelectedWorkspace(null);
                  }}
                  className="px-3 py-2 bg-[#6b7280]/20 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 bg-[#EF4444]/20 rounded-[8px] flex gap-3 items-center text-[#F87171]"
                >
                  Delete
                  <i
                    className={`${
                      loadingAdd
                        ? "ri-loader-4-line animate-spin"
                        : "ri-delete-bin-5-fill"
                    }`}
                  ></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        id="hero"
        className="flex flex-col w-full flex-1 items-center z-10 relative pb-6 justify-center"
      >
        <div className="w-full">
          <div className="flex flex-col items-center mt-4 md:gap-6">
            <p className="font-montserrat font-bold text-[32px] text-center bg-gradient-to-t from-[#949494] to-[#FAFAFA] bg-clip-text text-transparent md:text-[48px] md:w-[75%]">
              Welcome to <br />
              Gradia Workspace
            </p>
            <p className="text-center text-foreground-secondary mt-3 px-4 md:text-[24px] md:w-[65%]">
              Your personal space to plan, grow, and achieve more.
            </p>
          </div>
        </div>

        <div
          id="body-section"
          ref={containerRef}
          className="flex flex-col w-full py-9 px-3 gap-3 rounded-[12px] mt-8 text-center text-foreground bg-white/5 md:w-[75%]"
        >
          {loading ? (
            <div className="text-center text-foreground-secondary">
              Loading...
            </div>
          ) : (
            <>
              {workspaces.map((workspace, index) => (
                <div
                  key={workspace.id_workspace || index}
                  className="flex p-3 bg-[#141414] rounded-[8px] justify-between md:p-5 relative"
                >
                  {popupIndex === index && (
                    <div className="absolute bg-[#252424] p-4 flex flex-col gap-4 top-10 left-2 rounded-[12px] z-10 md:py-4">
                      <button
                        onClick={() => {
                          setPopupIndex(null);
                          setEditMode(index);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="flex gap-3 hover:text-primary md:pr-8"
                      >
                        <i className="ri-edit-line"></i>
                        <p>Edit</p>
                      </button>
                      <button
                        onClick={() => {
                          setPopupIndex(null);
                          setSelectedWorkspace(workspace);
                          setShowDeleteAlert(true);
                        }}
                        className="flex gap-3 hover:text-[#F87171]"
                      >
                        <i className="ri-delete-bin-fill"></i>
                        <p>Delete</p>
                      </button>
                    </div>
                  )}

                  {editMode !== index ? (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setPopupIndex((prev) =>
                              prev === index ? null : index
                            )
                          }
                        >
                          <i className="ri-more-2-fill text-[24px]"></i>
                        </button>
                        <div className="w-[42px] h-[35px] flex items-center justify-center bg-gradient-to-tl from-[#6a6a6a] to-[#141414] rounded-[4px]">
                          <span>
                            {workspace.name
                              ?.split(" ")
                              .map((word) => word[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                        <p className="font-semibold ml-1">{workspace.name}</p>
                      </div>
                      <Button
                        onClick={() => {enterWorkspace(workspace.id_workspace)
                          console.log(workspace.id_workspace)
                        }}
                        title="noText"
                        icon="ri-login-circle-line"
                        className={"flex-row-reverse !px-3"}
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        ref={inputRef}
                        type="text"
                        defaultValue={workspace.name}
                        placeholder="Edit workspace name"
                        className="px-2 w-full bg-[#333131]/50 rounded-[8px] h-[35px] focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleEdit(workspace.id_workspace);
                        }}
                      />
                      <Button
                        onClick={() => handleEdit(workspace.id_workspace)}
                        title="noText"
                        icon={`${
                          loadingAdd
                            ? "ri-loader-4-line animate-spin"
                            : "ri-check-line"
                        }`}
                        className={"flex-row-reverse !px-3 text-[24px]"}
                      />
                    </div>
                  )}
                </div>
              ))}

              {workspaces.length < 3 &&
                (!addMode ? (
                  <div className="flex p-3 bg-[#141414] rounded-[8px] justify-between md:p-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAddMode(true)}
                        type="button"
                        id="add-workspace"
                        className="w-[42px] flex items-center justify-center bg-[#393939] rounded-[4px] py-1"
                      >
                        <i className="ri-add-line text-[24px]"></i>
                      </button>
                      <p className="font-semibold ml-1 text-foreground-secondary">
                        Create new workspace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex p-3 bg-[#333131]/50 rounded-[8px] justify-between md:p-5 w-full">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Your workspace's name"
                      className="px-2 w-full focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                      }}
                    />
                    <Button
                      onClick={handleAdd}
                      title="noText"
                      icon={`${
                        loadingAdd
                          ? "ri-loader-4-line animate-spin"
                          : "ri-add-line"
                      }`}
                      className={"flex-row-reverse !px-3 text-[24px]"}
                    />
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mobile;

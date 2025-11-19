// src/features/profile/ProfilePage.tsx

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { UserAPI, type MeData } from "../../api/user";
import BottomNav from "../../components/BottomNav";
// Combined imports from media
import { MediaAPI, type MediaItem } from "../../api/media";

// ================================
// Helpers
// ================================
function formatCount(n: number) {
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
}

export default function ProfilePage() {
  const navigate = useNavigate();

  const [me, setMe] = useState<MeData | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Media Menu (3 dots)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Delete modal
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit media modal
  const [editMedia, setEditMedia] = useState<MediaItem | null>(null);
  const [editMediaTitle, setEditMediaTitle] = useState("");
  const [editMediaDesc, setEditMediaDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // ================================
  // Load profile
  // ================================
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await UserAPI.getMe();
        const data = res.data.data;

        setMe(data);
        // Ensure media is an array even if API returns null/undefined
        setItems(data.media ?? []);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ================================
  // Edit Profile handlers
  // ================================
  function startEdit() {
    if (!me) return;
    setIsEditing(true);
    setEditName(me.name);
    setEditEmail(me.email);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditFile(null);
    if (editPreview?.startsWith("blob:")) URL.revokeObjectURL(editPreview);
    setEditPreview(null);
    setEditError(null);
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setEditError("Please upload a valid image.");
      return;
    }

    if (editPreview?.startsWith("blob:")) URL.revokeObjectURL(editPreview);
    const url = URL.createObjectURL(f);

    setEditPreview(url);
    setEditFile(f);
    setEditError(null);
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!me || saving) return;

    try {
      setSaving(true);
      const res = await UserAPI.updateMe({
        name: editName,
        email: editEmail,
        file: editFile || undefined,
      });

      const updated = res.data.data;
      setMe(updated);
      cancelEdit();
    } catch (err: any) {
      setEditError(err?.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl =
    editPreview ||
    me?.avatarUrl ||
    (me
      ? `https://ui-avatars.com/api/?background=8b5cf6&color=fff&name=${me.name}`
      : "");

  const joinedYear = me ? new Date(me.createdAt).getFullYear() : null;

  // ================================
  // Delete Media Logic
  // ================================
  async function confirmDelete() {
    if (!deleteId) return;
    try {
      setDeleting(true);

      // 1. Call API
      await MediaAPI.deleteMedia(deleteId);

      // 2. Update Local State (Remove item from list)
      setItems((prev) => prev.filter((m) => m.id !== deleteId));

      // 3. Close Modal
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete media:", error);
      alert("Could not delete media. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  // ================================
  // Edit Media Logic
  // ================================
  async function saveMediaEdit() {
    if (!editMedia) return;

    try {
      setSavingEdit(true);

      // 1. Call API
      await MediaAPI.updateMedia(editMedia.id, {
        title: editMediaTitle,
        description: editMediaDesc,
      });

      // 2. Update Local State (Find item and update fields)
      setItems((prev) =>
        prev.map((m) =>
          m.id === editMedia.id
            ? { ...m, title: editMediaTitle, description: editMediaDesc }
            : m
        )
      );

      // 3. Close Modal
      setEditMedia(null);
    } catch (error) {
      console.error("Failed to update media:", error);
      alert("Could not save changes. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  }

  // ================================
  // UI
  // ================================
  return (
    <div className="min-h-screen bg-[#f7f6f8] flex justify-center">
      {/* Background overlay to close menus if open */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-20 bg-transparent"
          onClick={() => setOpenMenuId(null)}
        />
      )}

      <div className="relative w-full max-w-md min-h-screen bg-[#f7f6f8] flex flex-col">

        {/* HEADER */}
        <header className="sticky top-0 bg-[#f7f6f8]/90 backdrop-blur-md border-b border-zinc-200 p-4 flex justify-between items-center z-50">
          <button onClick={() => navigate("/")} className="p-1">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <h1 className="text-[15px] font-semibold">Profile</h1>
          <span className="w-6" />
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-24">

          {/* Loading */}
          {loading && (
            <p className="text-center mt-6 text-[#7c6189]">Loading…</p>
          )}

          {/* Error */}
          {error && (
            <p className="text-center text-red-500 mt-6">{error}</p>
          )}

          {/* MAIN CARD */}
          {!loading && !error && me && (
            <section className="mt-4 bg-white rounded-3xl shadow-lg pb-5">

              {/* Avatar */}
              <div className="flex flex-col items-center pt-6">
                <div className="h-24 w-24 rounded-full overflow-hidden shadow-lg bg-[#f3eefc]">
                  <img
                    src={avatarUrl}
                    alt={me.name}
                    className="object-cover w-full h-full"
                  />
                </div>

                <p className="mt-4 font-semibold text-[#161118]">
                  {me.name}
                </p>

                <p className="text-xs text-[#7c6189]">{me.email}</p>

                {joinedYear && (
                  <p className="text-xs text-[#a293bf] mt-1">
                    Joined in {joinedYear}
                  </p>
                )}

                {/* EDIT PROFILE BUTTON */}
                <button
                  className="mt-3 bg-[#f3eefc] px-3 py-1.5 text-xs rounded-full flex items-center gap-1 hover:bg-[#e8ddff]"
                  onClick={startEdit}
                >
                  <span className="material-symbols-outlined text-sm">
                    edit
                  </span>
                  Edit profile
                </button>
              </div>

              {/* EDIT PROFILE FORM */}
              {isEditing && (
                <div className="px-4 pt-4 mt-4 border-t border-[#efe9fd]">
                  <form onSubmit={handleSaveProfile} className="space-y-4">

                    {/* Avatar upload */}
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full overflow-hidden bg-[#f3eefc]">
                        <img
                          src={avatarUrl}
                          alt="Preview"
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <label className="text-xs underline cursor-pointer">
                        Change photo
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </div>

                    {/* NAME */}
                    <div>
                      <label className="text-xs">Name</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-[#faf8ff] border rounded-xl text-xs"
                      />
                    </div>

                    {/* EMAIL */}
                    <div>
                      <label className="text-xs">Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-[#faf8ff] border rounded-xl text-xs"
                      />
                    </div>

                    {editError && (
                      <p className="text-[11px] text-red-500">
                        {editError}
                      </p>
                    )}

                    {/* BUTTONS */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 bg-white border rounded-xl py-2 text-xs"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-[#ff3fd1] to-[#a855ff] text-white rounded-xl py-2 text-xs"
                        disabled={saving}
                      >
                        {saving ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* UPLOADS */}
              <div className="mt-5 px-4 flex justify-between items-center">
                <p className="text-sm font-semibold">Your uploads</p>
                <p className="text-[11px] text-[#a293bf]">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </p>
              </div>

              {/* GRID */}
              {items.length === 0 ? (
                <p className="px-4 pb-4 text-xs text-[#8a7aa7]">
                  No uploads yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 px-4 pb-4 mt-3">
                  {items.map((m) => {
                    return (
                      <div
                        key={m.id}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-[#e5e1f5]"
                      >
                        <img
                          src={m.thumbnailUrl || m.url}
                          alt={m.title || "Media"}
                          className="w-full h-full object-cover"
                        />

                        {/* 3 dots Button */}
                        <button
                          className="absolute top-2 right-2 bg-black/40 p-1 rounded-full text-white z-30"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent closing immediately
                            setOpenMenuId(
                              openMenuId === m.id ? null : m.id
                            )
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">
                            more_vert
                          </span>
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === m.id && (
                          <div className="absolute top-10 right-2 bg-white shadow-lg rounded-xl w-32 py-2 text-sm z-40">
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-purple-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditMedia(m);
                                setEditMediaTitle(m.title || "");
                                setEditMediaDesc(
                                  m.description || ""
                                );
                                setOpenMenuId(null);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(m.id);
                                setOpenMenuId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {/* likes overlay */}
                        <div className="absolute inset-0 bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/40 transition flex items-end pointer-events-none">
                          <div className="m-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">
                              favorite
                            </span>
                            {formatCount(m.likesCount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>

        <BottomNav />
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <p className="text-sm font-semibold mb-4">
              Delete this media?
            </p>

            <div className="flex gap-2">
              <button
                className="flex-1 py-2 bg-gray-200 rounded-xl text-sm font-medium"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEDIA MODAL */}
      {editMedia && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-xs shadow-xl">
            <p className="text-sm font-semibold mb-4">
              Edit media
            </p>

            <input
              value={editMediaTitle}
              onChange={(e) => setEditMediaTitle(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-[#faf8ff] mb-3 outline-none focus:border-purple-400"
              placeholder="Title"
            />

            <textarea
              value={editMediaDesc}
              onChange={(e) => setEditMediaDesc(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm bg-[#faf8ff] outline-none focus:border-purple-400 resize-none"
              rows={3}
              placeholder="Description"
            />

            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 py-2 bg-gray-200 rounded-xl text-sm font-medium"
                onClick={() => setEditMedia(null)}
                disabled={savingEdit}
              >
                Cancel
              </button>

              <button
                className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium"
                onClick={saveMediaEdit}
                disabled={savingEdit}
              >
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
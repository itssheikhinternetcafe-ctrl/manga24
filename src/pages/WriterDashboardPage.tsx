import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import {
  dbCreateChapter,
  dbCreateSeries,
  dbGetChapters,
  dbGetSeriesByAuthor,
  dbUpdateChapter,
  dbUpdateSeries,
} from "../services/db";
import { uploadMediaFile } from "../firebase";
import { Chapter, MangaType, Series, StoryApprovalStatus } from "../types";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Save,
  Upload,
  User,
  X,
} from "lucide-react";

const WRITER_GENRES = [
  "Action",
  "Fantasy",
  "Romance",
  "Isekai",
  "Martial Arts",
  "Sci-Fi",
];
const WRITER_TYPES: { value: MangaType; label: string }[] = [
  { value: "Manga", label: "Manga" },
  { value: "Manhwa", label: "Manhwa" },
  { value: "Manhua", label: "Manhua" },
  { value: "Webtoon", label: "Webtoon" },
  { value: "Novel", label: "Web novel" },
];
type DashboardView = "overview" | "new" | "manage" | "comments" | "profile";
const mediaTypes: MangaType[] = ["Manga", "Manhwa", "Manhua", "Webtoon"];
const statusClass: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  draft: "bg-[#A79FC0]/15 text-[#A79FC0] border-[#A79FC0]/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};
const naturalSort = (a: File, b: File) =>
  a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
const cleanName = (value: string) => value.trim().replace(/[<>]/g, "");
const validPenName = (value: string) =>
  value.length >= 2 &&
  value.length <= 40 &&
  /^[\p{L}\p{N} ._'\-]+$/u.test(value);
const validStoryText = (value: string) =>
  value.length >= 2 &&
  value.length <= 40 &&
  !/[<>\u0000-\u001F\u007F]/.test(value);

export const WriterDashboardPage: React.FC = () => {
  const { user, setAuthModalOpen, showToast, updateProfile } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<DashboardView>(
    searchParams.get("edit") ? "manage" : "overview",
  );
  const [stories, setStories] = useState<Series[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedStory, setSelectedStory] = useState<Series | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPages, setUploadingPages] = useState(false);
  const [pageUploadProgress, setPageUploadProgress] = useState("");
  const [error, setError] = useState("");
  const [profileName, setProfileName] = useState(user?.defaultPenName || "");
  const [form, setForm] = useState({
    title: "",
    type: "Manga" as MangaType,
    genres: [] as string[],
    description: "",
    coverUrl: "",
    author: "",
    artist: "",
    number: 1,
    chapterTitle: "",
    pages: [] as string[],
    textContent: "",
  });

  const loadStories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ownedStories = await dbGetSeriesByAuthor(user.id);
      const correctedStories = await Promise.all(
        ownedStories.map(async (story) => {
          const storyChapters = await dbGetChapters(story.id, false);
          const latestChapterNumber = storyChapters.reduce(
            (max, chapter) => Math.max(max, chapter.number),
            0,
          );
          return {
            ...story,
            totalChapters: storyChapters.length,
            latestChapterNumber,
          };
        }),
      );
      setStories(
        correctedStories.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
    } catch {
      setError("Could not load your stories. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadStories();
  }, [user?.id]);
  useEffect(() => {
    setProfileName(user?.defaultPenName || "");
  }, [user?.defaultPenName]);

  const resetChapterForm = (story: Series, chapter?: Chapter) => {
    const nextNumber =
      chapter?.number ||
      (chapters.length
        ? Math.max(...chapters.map((item) => item.number)) + 1
        : (story.latestChapterNumber || 0) + 1);
    setEditingChapter(chapter || null);
    setForm((current) => ({
      ...current,
      type: story.type,
      number: nextNumber,
      chapterTitle: chapter?.title || "",
      pages: chapter?.pages || [],
      textContent: chapter?.textContent || "",
    }));
  };
  const openNewStory = () => {
    setSelectedStory(null);
    setEditingChapter(null);
    setError("");
    setForm({
      title: "",
      type: "Manga",
      genres: [],
      description: "",
      coverUrl: "",
      author: user?.defaultPenName || user?.username || "",
      artist: "",
      number: 1,
      chapterTitle: "",
      pages: [],
      textContent: "",
    });
    setView("new");
  };
  const openManagement = async (story: Series) => {
    setError("");
    setSelectedStory(story);
    setView("manage");
    const list = await dbGetChapters(story.id, true);
    setChapters(list);
    setForm((current) => ({
      ...current,
      title: story.title,
      type: story.type,
      description: story.synopsis,
      coverUrl: story.coverUrl,
      author: story.author,
      artist: story.artist || "",
      genres: story.genres,
    }));
    resetChapterForm(story);
  };
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && stories.length) {
      const story = stories.find((item) => item.id === editId);
      if (story) openManagement(story);
    }
  }, [searchParams, stories]);
  const updateForm = (
    field: keyof typeof form,
    value: string | number | string[],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      updateForm("coverUrl", await uploadMediaFile(file, "writer_covers"));
    } catch {
      setError("The cover could not be uploaded.");
    } finally {
      setUploadingCover(false);
    }
  };
  const handlePagesUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []).sort(naturalSort);
    if (!files.length) return;
    setUploadingPages(true);
    setError("");
    try {
      const urls: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        setPageUploadProgress(`Uploading ${index + 1} of ${files.length}`);
        urls.push(await uploadMediaFile(files[index], "writer_chapters"));
      }
      updateForm("pages", [...form.pages, ...urls]);
    } catch {
      setError("One or more pages could not be uploaded.");
    } finally {
      setUploadingPages(false);
      setPageUploadProgress("");
    }
  };

  const saveStory = async (approvalStatus: StoryApprovalStatus) => {
    if (!user) return;
    setError("");
    const author = cleanName(form.author);
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.coverUrl.trim() ||
      !author
    ) {
      setError(
        "Please add a title, cover image, description, and author name.",
      );
      return;
    }
    if (!validPenName(author)) {
      setError("Author name must be 2 to 40 plain-text characters.");
      return;
    }
    if (form.artist && !validPenName(cleanName(form.artist))) {
      setError("Artist name must be 2 to 40 plain-text characters.");
      return;
    }
    if (!form.genres.length) {
      setError("Please choose at least one genre.");
      return;
    }
    if (form.type === "Novel" ? !form.textContent.trim() : !form.pages.length) {
      setError(
        form.type === "Novel"
          ? "Please write Chapter 1."
          : "Please upload at least one Chapter 1 page.",
      );
      return;
    }
    setSaving(true);
    try {
      const story = await dbCreateSeries({
        title: form.title.trim(),
        type: form.type,
        genres: form.genres,
        synopsis: form.description.trim(),
        coverUrl: form.coverUrl,
        author,
        artist: cleanName(form.artist),
        authorId: user.id,
        authorName: author,
        creatorId: user.id,
        approvalStatus: approvalStatus === "published" ? "published" : "draft",
        isDraft: approvalStatus !== "published",
      });
      await dbCreateChapter({
        seriesId: story.id,
        number: 1,
        title: cleanName(form.chapterTitle) || "Chapter 1",
        pages: form.type === "Novel" ? [] : form.pages,
        textContent: form.type === "Novel" ? form.textContent : "",
        isDraft: approvalStatus !== "published",
        approvalStatus: approvalStatus === "published" ? "published" : "draft",
        creatorId: user.id,
        authorId: user.id,
        authorName: author,
      });
      showToast(
        "Story saved",
        approvalStatus === "published"
          ? "Your story is now visible to readers."
          : "Your draft is saved.",
        "success",
      );
      await loadStories();
      setView("overview");
    } catch (err: any) {
      setError(err.message || "Could not save the story.");
    } finally {
      setSaving(false);
    }
  };
  const saveChapter = async (publish: boolean) => {
    if (!user || !selectedStory) return;
    setError("");
    if (!Number.isFinite(form.number) || form.number < 1) {
      setError("Chapter number must be 1 or higher.");
      return;
    }
    if (form.type === "Novel" ? !form.textContent.trim() : !form.pages.length) {
      setError(
        form.type === "Novel"
          ? "Please write the chapter."
          : "Please upload at least one page.",
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        seriesId: selectedStory.id,
        number: Number(form.number),
        title: cleanName(form.chapterTitle) || `Chapter ${form.number}`,
        pages: form.type === "Novel" ? [] : form.pages,
        textContent: form.type === "Novel" ? form.textContent : "",
        isDraft: !publish,
        approvalStatus: publish ? ("published" as const) : ("draft" as const),
        creatorId: user.id,
        authorId: user.id,
        authorName: selectedStory.author,
      };
      const saved = editingChapter
        ? await dbUpdateChapter(editingChapter.id, payload)
        : await dbCreateChapter(payload);
      if (!saved) throw new Error("Chapter could not be saved.");
      const list = await dbGetChapters(selectedStory.id, true);
      setChapters(list);
      const refreshed = await dbGetSeriesByAuthor(user.id);
      const current =
        refreshed.find((item) => item.id === selectedStory.id) || selectedStory;
      setSelectedStory(current);
      setStories(
        refreshed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
      resetChapterForm(current);
      showToast(publish ? "Chapter published" : "Draft saved", "", "success");
    } catch (err: any) {
      setError(err.message || "Could not save the chapter.");
    } finally {
      setSaving(false);
    }
  };
  const saveStatus = async (status: Series["status"]) => {
    if (
      !selectedStory ||
      (status === "Completed" &&
        !window.confirm("Mark as completed? You can reopen it later."))
    )
      return;
    const updated = await dbUpdateSeries(selectedStory.id, { status });
    if (updated) {
      setSelectedStory(updated);
      setStories((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      showToast(
        "Status updated",
        `Story marked ${status.toLowerCase()}.`,
        "success",
      );
    }
  };
  const saveStoryDetails = async () => {
    if (!selectedStory) return false;
    setError("");
    setSaving(true);
    const author = cleanName(form.author);
    const title = form.title.trim();
    const artist = cleanName(form.artist);
    if (
      !validStoryText(title) ||
      !validPenName(author) ||
      (artist && !validPenName(artist))
    ) {
      setError(
        "Title, author name, and artist must be 2 to 40 plain-text characters.",
      );
      setSaving(false);
      return false;
    }
    try {
      const updated = await dbUpdateSeries(selectedStory.id, {
        title,
        author,
        authorName: author,
        artist,
      });
      if (!updated) throw new Error("Story details could not be saved.");
      setSelectedStory(updated);
      setStories((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      showToast(
        "Story details saved",
        "Your public title, pen name, and artist were updated.",
        "success",
      );
      return true;
    } catch (err: any) {
      setError(err.message || "Story details could not be saved.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (!user)
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#171122] border border-[#2C2340] text-center">
          <BookOpen className="w-10 h-10 text-[#FF4D6D] mx-auto mb-4" />
          <h1 className="text-xl font-black font-heading mb-2">
            Writer Dashboard
          </h1>
          <p className="text-xs text-[#A79FC0] mb-5">
            Sign in to create and manage your stories.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  const panel =
    "p-4 rounded-2xl bg-[#171122] light:bg-white border border-[#2C2340] light:border-[#E2D9F3]";
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 text-[#F5F1FF] light:text-[#1A1429]">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <div className={`${panel} lg:sticky lg:top-24`}>
            <p className="text-[10px] uppercase tracking-wider text-[#8B5CFF] font-bold">
              Writer Dashboard
            </p>
            <p className="text-sm font-bold font-heading truncate mt-1 mb-3">
              {user.defaultPenName || user.username}
            </p>
            {(
              [
                ["overview", "Overview", LayoutDashboard],
                ["new", "New story", Plus],
                ["comments", "Comments", MessageSquare],
                ["profile", "Profile", User],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-left ${view === key ? "bg-[#FF4D6D] text-white" : "text-[#A79FC0] hover:bg-[#1F1830]"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
            <Link
              to="/creator-upload"
              className="flex items-center gap-2 px-3 py-2.5 mt-2 text-xs font-semibold text-[#8B5CFF]"
            >
              <Upload className="w-4 h-4" />
              Existing Submit Work
            </Link>
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          {view === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black font-heading">Overview</h1>
                  <p className="text-xs text-[#A79FC0] mt-1">
                    Your stories, chapters, and publication status.
                  </p>
                </div>
                <button
                  onClick={openNewStory}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                  New story
                </button>
              </div>
              <section className={`${panel} overflow-hidden`}>
                <h2 className="font-bold font-heading mb-3">My stories</h2>
                {loading ? (
                  <p className="p-8 text-center text-xs text-[#A79FC0]">
                    Loading your stories...
                  </p>
                ) : stories.length === 0 ? (
                  <p className="p-8 text-center text-xs text-[#A79FC0]">
                    You have not created a story yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#2C2340]/60">
                    {stories.map((story) => (
                      <button
                        key={story.id}
                        onClick={() => openManagement(story)}
                        className="w-full p-3 sm:p-4 flex items-center gap-3 text-left hover:bg-[#1F1830]/60"
                      >
                        <img
                          src={story.coverUrl || story.coverImage}
                          alt=""
                          className="w-11 h-14 object-cover rounded-lg shrink-0 bg-[#0E0A14]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">
                            {story.title}
                          </p>
                          <p className="text-[11px] text-[#A79FC0] mt-1">
                            {story.type} · {story.totalChapters || 0} chapters ·{" "}
                            {story.author}
                          </p>
                        </div>
                        <span
                          className={`hidden sm:inline-block px-2 py-1 rounded-full border text-[10px] font-bold ${statusClass[story.approvalStatus || "draft"]}`}
                        >
                          {story.approvalStatus === "published"
                            ? "Published"
                            : story.approvalStatus === "rejected"
                              ? "Removed by admin"
                              : "Draft"}
                        </span>
                        <Edit3 className="w-4 h-4 text-[#FF9F1C]" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
          {view === "new" && (
            <StoryForm
              form={form}
              updateForm={updateForm}
              handleCoverUpload={handleCoverUpload}
              handlePagesUpload={handlePagesUpload}
              uploadingCover={uploadingCover}
              uploadingPages={uploadingPages}
              pageUploadProgress={pageUploadProgress}
              error={error}
              saving={saving}
              saveStory={saveStory}
              user={user}
            />
          )}
          {view === "manage" && selectedStory && (
            <>
              <StoryDetails
                story={selectedStory}
                form={form}
                updateForm={updateForm}
                saving={saving}
                error={error}
                saveStoryDetails={saveStoryDetails}
                defaultPenName={user.defaultPenName || ""}
              />
              <Management
                story={selectedStory}
                chapters={chapters}
                form={form}
                updateForm={updateForm}
                editingChapter={editingChapter}
                resetChapterForm={resetChapterForm}
                handlePagesUpload={handlePagesUpload}
                uploadingPages={uploadingPages}
                pageUploadProgress={pageUploadProgress}
                saving={saving}
                error={error}
                saveChapter={saveChapter}
                saveStatus={saveStatus}
              />
            </>
          )}
          {view === "comments" && (
            <div className={panel}>
              <MessageSquare className="w-8 h-8 text-[#8B5CFF] mb-3" />
              <h2 className="font-bold font-heading">Comments</h2>
              <p className="text-xs text-[#A79FC0] mt-2">
                Comments on your published stories will appear here.
              </p>
            </div>
          )}
          {view === "profile" && (
            <div className={`${panel} space-y-4`}>
              <User className="w-7 h-7 text-[#FF9F1C]" />
              <h2 className="text-lg font-bold font-heading">Writer profile</h2>
              <p className="text-xs text-[#A79FC0]">
                {user.username} · {user.email}
              </p>
              <div>
                <label className="text-xs font-bold block mb-1.5">
                  Default pen name
                </label>
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="writer-input"
                  placeholder={user.username}
                />
                <p className="text-[11px] text-[#A79FC0] mt-1">
                  Use 2 to 40 plain-text characters. This fills new stories
                  automatically.
                </p>
              </div>
              <button
                onClick={async () => {
                  const name = cleanName(profileName);
                  if (!validPenName(name)) {
                    setError("Pen name must be 2 to 40 plain-text characters.");
                    return;
                  }
                  try {
                    await updateProfile({ defaultPenName: name });
                    setError("");
                  } catch (err: any) {
                    setError(err.message || "Could not save your pen name.");
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold"
              >
                Save profile
              </button>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

type FormProps = {
  form: any;
  updateForm: (field: any, value: any) => void;
  handleCoverUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePagesUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingCover: boolean;
  uploadingPages: boolean;
  pageUploadProgress: string;
  error: string;
  saving: boolean;
  saveStory: (status: StoryApprovalStatus) => void;
  user: any;
};
const StoryForm: React.FC<FormProps> = ({
  form,
  updateForm,
  handleCoverUpload,
  handlePagesUpload,
  uploadingCover,
  uploadingPages,
  pageUploadProgress,
  error,
  saving,
  saveStory,
  user,
}) => (
  <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black font-heading">New story</h1>
        <p className="text-xs text-[#A79FC0] mt-1">
          Add your story and first chapter.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          disabled={saving}
          onClick={() => saveStory("draft")}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#2C2340] text-xs font-bold"
        >
          <Save className="w-4 h-4" />
          Save draft
        </button>
        <button
          disabled={saving}
          onClick={() => saveStory("published")}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold"
        >
          <Check className="w-4 h-4" />
          Publish
        </button>
      </div>
    </div>
    {error && (
      <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
        {error}
      </p>
    )}
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
      <section className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] h-fit">
        <label className="text-xs font-bold block mb-2">Cover image</label>
        <div className="aspect-[3/4] rounded-xl bg-[#0E0A14] overflow-hidden flex items-center justify-center">
          {form.coverUrl ? (
            <img
              src={form.coverUrl}
              alt="Cover preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-[#8B5CFF]/60" />
          )}
        </div>
        <label className="mt-3 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#8B5CFF]/15 text-[#8B5CFF] text-xs font-bold cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploadingCover ? "Uploading..." : "Upload cover"}
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </label>
      </section>
      <section className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] space-y-4">
        <Field
          label="Title"
          value={form.title}
          onChange={(value) => updateForm("title", value)}
        />
        <Field
          label="Author name (pen name)"
          value={form.author}
          onChange={(value) => updateForm("author", value)}
          placeholder={user.defaultPenName || user.username}
        />
        <Field
          label="Artist (optional)"
          value={form.artist}
          onChange={(value) => updateForm("artist", value)}
        />
        <div>
          <label className="text-xs font-bold block mb-1.5">Type</label>
          <select
            value={form.type}
            onChange={(event) => updateForm("type", event.target.value)}
            className="writer-input"
          >
            {WRITER_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold block mb-1.5">Genres</label>
          <div className="flex flex-wrap gap-2">
            {WRITER_GENRES.map((genre) => (
              <button
                type="button"
                key={genre}
                onClick={() =>
                  updateForm(
                    "genres",
                    form.genres.includes(genre)
                      ? form.genres.filter((item: string) => item !== genre)
                      : [...form.genres, genre],
                  )
                }
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold ${form.genres.includes(genre) ? "bg-[#8B5CFF] text-white" : "border-[#2C2340] text-[#A79FC0]"}`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
        <Field
          label="Description"
          value={form.description}
          onChange={(value) => updateForm("description", value)}
          multiline
        />
        <ChapterEditor
          form={form}
          updateForm={updateForm}
          handlePagesUpload={handlePagesUpload}
          uploadingPages={uploadingPages}
          pageUploadProgress={pageUploadProgress}
          media={mediaTypes.includes(form.type)}
        />
      </section>
    </div>
  </div>
);

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, multiline, placeholder }) => (
  <div>
    <label className="text-xs font-bold block mb-1.5">{label}</label>
    {multiline ? (
      <textarea
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="writer-input resize-y"
        placeholder={placeholder}
      />
    ) : (
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="writer-input"
        placeholder={placeholder}
      />
    )}
  </div>
);
const StoryDetails: React.FC<any> = ({
  form,
  updateForm,
  saving,
  error,
  saveStoryDetails,
  defaultPenName,
}) => {
  const [saved, setSaved] = useState(false);
  const save = async () => {
    setSaved(false);
    if (await saveStoryDetails()) setSaved(true);
  };
  return (
    <section className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] space-y-4">
      <div>
        <h2 className="font-bold font-heading">Story details</h2>
        <p className="text-[11px] text-[#A79FC0] mt-1">
          These details are shown to readers.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field
          label="Title"
          value={form.title}
          onChange={(value) => updateForm("title", value)}
        />
        <Field
          label="Author name (pen name)"
          value={form.author}
          onChange={(value) => updateForm("author", value)}
        />
        <Field
          label="Artist (optional)"
          value={form.artist}
          onChange={(value) => updateForm("artist", value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <button
          type="button"
          disabled={!defaultPenName || saving}
          onClick={() => updateForm("author", defaultPenName)}
          className="px-3 py-2.5 rounded-xl border border-[#2C2340] text-xs font-bold"
        >
          Use my default pen name
        </button>
        {saved && (
          <span className="text-xs text-emerald-400">Story details saved.</span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </section>
  );
};
const PageList: React.FC<{
  pages: string[];
  updateForm: (field: string, value: string[]) => void;
}> = ({ pages, updateForm }) => (
  <div className="flex flex-wrap gap-2">
    {pages.map((page, index) => (
      <div key={`${page}-${index}`} className="relative">
        <img
          src={page}
          alt={`Page ${index + 1}`}
          className="w-16 h-20 object-cover rounded-lg"
        />
        <div className="absolute -right-1 -top-1 flex gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => {
              const next = [...pages];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              updateForm("pages", next);
            }}
            className="rounded-full bg-[#8B5CFF] text-white p-0.5 disabled:opacity-30"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            disabled={index === pages.length - 1}
            onClick={() => {
              const next = [...pages];
              [next[index], next[index + 1]] = [next[index + 1], next[index]];
              updateForm("pages", next);
            }}
            className="rounded-full bg-[#8B5CFF] text-white p-0.5 disabled:opacity-30"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() =>
              updateForm(
                "pages",
                pages.filter((_, item) => item !== index),
              )
            }
            className="rounded-full bg-red-500 text-white p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    ))}
  </div>
);
const ChapterEditor: React.FC<any> = ({
  form,
  updateForm,
  handlePagesUpload,
  uploadingPages,
  pageUploadProgress,
  media,
}) => (
  <div className="space-y-3 border-t border-[#2C2340] pt-4">
    <div className="flex items-center gap-2">
      <FileText className="w-5 h-5 text-[#FF9F1C]" />
      <h2 className="font-bold font-heading">Chapter 1</h2>
    </div>
    <Field
      label="Chapter title (optional)"
      value={form.chapterTitle}
      onChange={(value) => updateForm("chapterTitle", value)}
      placeholder="Chapter 1"
    />
    {media ? (
      <>
        <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#8B5CFF]/15 text-[#8B5CFF] text-xs font-bold cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload pages in filename order
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePagesUpload}
            className="hidden"
          />
        </label>
        {uploadingPages && (
          <p className="text-xs text-[#A79FC0]">{pageUploadProgress}</p>
        )}
        <PageList pages={form.pages} updateForm={updateForm} />
      </>
    ) : (
      <textarea
        rows={12}
        value={form.textContent}
        onChange={(event) => updateForm("textContent", event.target.value)}
        className="writer-input resize-y"
        placeholder="Write Chapter 1 here..."
      />
    )}
  </div>
);

const Management: React.FC<any> = ({
  story,
  chapters,
  form,
  updateForm,
  editingChapter,
  resetChapterForm,
  handlePagesUpload,
  uploadingPages,
  pageUploadProgress,
  saving,
  error,
  saveChapter,
  saveStatus,
}) => (
  <div className="space-y-5">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div>
        <button
          onClick={() => window.history.back()}
          className="text-xs text-[#A79FC0] mb-2"
        >
          Back to stories
        </button>
        <h1 className="text-2xl font-black font-heading">{story.title}</h1>
        <p className="text-xs text-[#A79FC0] mt-1">
          {story.author} {story.artist ? `· Art by ${story.artist}` : ""}
        </p>
      </div>
      <select
        value={story.status}
        onChange={(event) => saveStatus(event.target.value)}
        className="writer-input w-auto"
      >
        <option>Ongoing</option>
        <option>Completed</option>
        <option>Hiatus</option>
      </select>
    </div>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-bold">
        {story.status === "Completed"
          ? "This story is marked as completed"
          : "Chapters"}
      </p>
      {story.status === "Completed" ? (
        <button
          onClick={() => saveStatus("Ongoing")}
          className="px-3 py-2 rounded-xl border border-[#2C2340] text-xs font-bold"
        >
          Reopen as ongoing
        </button>
      ) : (
        <button
          onClick={() => resetChapterForm(story)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-brand text-white text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          Add chapter
        </button>
      )}
    </div>
    <section className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340]">
      <div className="space-y-2">
        {chapters.length ? (
          chapters
            .sort((a: Chapter, b: Chapter) => b.number - a.number)
            .map((chapter: Chapter) => (
              <button
                key={chapter.id}
                onClick={() => resetChapterForm(story, chapter)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 text-left ${editingChapter?.id === chapter.id ? "bg-[#8B5CFF]/15" : "bg-[#0E0A14]/50"}`}
              >
                <span className="font-bold text-[#FF9F1C]">
                  #{chapter.number}
                </span>
                <span className="flex-1 min-w-0 text-xs truncate">
                  {chapter.title}
                </span>
                <span
                  className={`text-[10px] px-2 py-1 rounded-full border ${chapter.isDraft ? statusClass.draft : statusClass.published}`}
                >
                  {chapter.isDraft ? "Draft" : "Published"}
                </span>
                <span className="text-[10px] text-[#A79FC0]">
                  {new Date(chapter.publishedAt).toLocaleDateString()}
                </span>
              </button>
            ))
        ) : (
          <p className="text-xs text-[#A79FC0]">No chapters yet.</p>
        )}
      </div>
    </section>
    {story.status !== "Completed" && (
      <section className="p-4 rounded-2xl bg-[#171122] border border-[#2C2340] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold font-heading">
            {editingChapter
              ? `Edit chapter ${editingChapter.number}`
              : `Add chapter ${form.number}`}
          </h2>
          <span className="text-[10px] text-[#A79FC0]">
            Writers cannot delete chapters
          </span>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Chapter number"
            value={String(form.number)}
            onChange={(value) => updateForm("number", Number(value))}
          />
          <Field
            label="Chapter title (optional)"
            value={form.chapterTitle}
            onChange={(value) => updateForm("chapterTitle", value)}
          />
        </div>
        {mediaTypes.includes(story.type) ? (
          <>
            <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#8B5CFF]/15 text-[#8B5CFF] text-xs font-bold cursor-pointer">
              <Upload className="w-4 h-4" />
              Add page images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePagesUpload}
                className="hidden"
              />
            </label>
            {uploadingPages && (
              <p className="text-xs text-[#A79FC0]">{pageUploadProgress}</p>
            )}
            <PageList pages={form.pages} updateForm={updateForm} />
          </>
        ) : (
          <textarea
            rows={14}
            value={form.textContent}
            onChange={(event) => updateForm("textContent", event.target.value)}
            className="writer-input resize-y"
            placeholder="Write your chapter here..."
          />
        )}
        <div className="flex flex-wrap gap-2">
          <button
            disabled={saving}
            onClick={() => saveChapter(false)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#2C2340] text-xs font-bold"
          >
            <Save className="w-4 h-4" />
            Save as draft
          </button>
          <button
            disabled={saving}
            onClick={() => saveChapter(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold"
          >
            <Check className="w-4 h-4" />
            Publish chapter
          </button>
        </div>
      </section>
    )}
  </div>
);

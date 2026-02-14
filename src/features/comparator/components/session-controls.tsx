"use client";

import { useState } from "react";
import { Save, Share2, FolderOpen, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComparatorStore } from "../store/comparator-store";
import {
  saveSession,
  loadAllSessions,
  deleteSession,
  getShareUrl,
  type SavedSession,
} from "../lib/session";

export function SessionControls() {
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [shared, setShared] = useState(false);

  const store = useComparatorStore();

  function handleSave() {
    const name = `Session ${new Date().toLocaleString()}`;
    saveSession({
      name,
      modality: store.modality,
      selectedModelIds: store.selectedModelIds,
      prompt: store.prompt,
      preferences: store.preferences,
    });
  }

  function handleShare() {
    const url = getShareUrl({
      name: "",
      modality: store.modality,
      selectedModelIds: store.selectedModelIds,
      prompt: store.prompt,
      preferences: store.preferences,
    });
    navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  function handleLoad() {
    setSessions(loadAllSessions());
    setShowSessions(!showSessions);
  }

  function handleLoadSession(session: SavedSession) {
    store.setModality(session.modality);
    // Need to set models manually since setModality clears them
    for (const id of session.selectedModelIds) {
      store.toggleModel(id);
    }
    store.setPrompt(session.prompt);
    store.setPreference("quality", session.preferences.quality);
    store.setPreference("cost", session.preferences.cost);
    store.setPreference("speed", session.preferences.speed);
    setShowSessions(false);
  }

  function handleDelete(id: string) {
    deleteSession(id);
    setSessions(loadAllSessions());
  }

  const canShare =
    store.selectedModelIds.length >= 2 && store.prompt.trim().length > 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!canShare}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            canShare
              ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              : "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
          )}
        >
          <Save size={12} /> Save
        </button>

        <button
          onClick={handleShare}
          disabled={!canShare}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            shared
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : canShare
                ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                : "cursor-not-allowed text-zinc-300 dark:text-zinc-600"
          )}
        >
          {shared ? (
            <>
              <Check size={12} /> Copied URL
            </>
          ) : (
            <>
              <Share2 size={12} /> Share
            </>
          )}
        </button>

        <button
          onClick={handleLoad}
          className="flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          <FolderOpen size={12} /> Load
        </button>
      </div>

      {showSessions && (
        <div className="absolute right-0 top-full z-10 mt-1 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {sessions.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-zinc-400">
              No saved sessions
            </p>
          ) : (
            <div className="max-h-60 space-y-1 overflow-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <button
                    onClick={() => handleLoadSession(session)}
                    className="flex-1 text-left text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="block truncate font-medium">
                      {session.name}
                    </span>
                    <span className="text-zinc-400">
                      {session.selectedModelIds.length} models -{" "}
                      {session.modality}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="ml-2 shrink-0 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

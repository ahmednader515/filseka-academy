"use client";

import { useT } from "@/components/LocaleProvider";
import { getYouTubeVideoId } from "@/lib/youtube";
import { PlyrVideoPlayer } from "@/components/plyr-video-player";

export function LessonVideoPreview({ videoUrl }: { videoUrl: string }) {
  const t = useT();
  const youtubeVideoId = getYouTubeVideoId(videoUrl);

  if (!youtubeVideoId) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-muted)]">{t("dashboard.courseForm.videoPreview")}</p>
      <div className="lesson-video-shell relative aspect-video min-w-0 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-black">
        <PlyrVideoPlayer
          key={youtubeVideoId}
          youtubeVideoId={youtubeVideoId}
          storageKey={`course-preview-${youtubeVideoId}`}
          reloadPageOnQualityChange={false}
        />
      </div>
    </div>
  );
}

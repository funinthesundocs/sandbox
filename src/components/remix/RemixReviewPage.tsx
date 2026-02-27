'use client';

import { useState } from 'react';
import { TitleGrid } from './TitleGrid';
import { ThumbnailCards } from './ThumbnailCards';
import { SceneEditor } from './SceneEditor';
import { ApprovalGate } from './ApprovalGate';

interface Title {
  id: string;
  style: string;
  title: string;
  reasoning: string | null;
  is_selected: boolean;
}

interface Thumbnail {
  id: string;
  prompt: string;
  file_path: string;
  is_selected: boolean;
  signedUrl: string | null;
}

interface Scene {
  id: string;
  scene_number: number;
  dialogue_line: string;
  duration_seconds: number;
  broll_description: string;
}

interface RemixReviewPageProps {
  videoId: string;
  projectId: string;
  titles: Title[];
  thumbnails: Thumbnail[];
  scenes: Scene[];
}

export function RemixReviewPage({
  videoId,
  projectId,
  titles,
  thumbnails,
  scenes,
}: RemixReviewPageProps) {
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(
    titles.find((t) => t.is_selected)?.id ?? null
  );
  const [selectedThumbnailId, setSelectedThumbnailId] = useState<string | null>(
    thumbnails.find((t) => t.is_selected)?.id ?? null
  );

  const selectedTitle = titles.find((t) => t.id === selectedTitleId);
  const selectedThumbnailIndex = thumbnails.findIndex(
    (t) => t.id === selectedThumbnailId
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-10">
      <ApprovalGate
        videoId={videoId}
        projectId={projectId}
        hasTitleSelected={selectedTitleId != null}
        hasThumbnailSelected={selectedThumbnailId != null}
        hasScript={scenes.length > 0}
        selectedTitleText={selectedTitle?.title}
        selectedThumbnailIndex={
          selectedThumbnailIndex >= 0 ? selectedThumbnailIndex : undefined
        }
        sceneCount={scenes.length}
      />

      <TitleGrid
        titles={titles}
        videoId={videoId}
        projectId={projectId}
        onSelectionChange={setSelectedTitleId}
        onRegenerate={handleRefresh}
      />

      <ThumbnailCards
        thumbnails={thumbnails}
        videoId={videoId}
        projectId={projectId}
        onSelectionChange={setSelectedThumbnailId}
      />

      <SceneEditor
        scenes={scenes}
        videoId={videoId}
        projectId={projectId}
        onRegenerate={handleRefresh}
      />
    </div>
  );
}

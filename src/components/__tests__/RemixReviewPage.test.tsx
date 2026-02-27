import React from 'react';
import { render, screen } from '@testing-library/react';
import { RemixReviewPage } from '../remix/RemixReviewPage';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn() }),
}));

// Mock fetch for API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ success: true }),
});

const mockTitles = Array(8).fill(null).map((_, i) => ({
  id: `title-${i}`,
  style: 'Curiosity Gap',
  title: `Title variation ${i + 1}`,
  reasoning: `Reasoning ${i + 1}`,
  is_selected: i === 0,
}));

const mockThumbnails = [
  { id: 'thumb-1', prompt: 'bold prompt', file_path: 'thumbnails/bold.jpg', is_selected: false, signedUrl: null },
  { id: 'thumb-2', prompt: 'cinematic prompt', file_path: 'thumbnails/cinematic.jpg', is_selected: false, signedUrl: null },
  { id: 'thumb-3', prompt: 'face prompt', file_path: 'thumbnails/face.jpg', is_selected: false, signedUrl: null },
];

const mockScenes = [
  { id: 'scene-1', scene_number: 1, dialogue_line: 'Opening scene dialogue.', duration_seconds: 20, broll_description: 'Wide shot' },
  { id: 'scene-2', scene_number: 2, dialogue_line: 'Main content dialogue.', duration_seconds: 30, broll_description: 'Close-up' },
];

describe('RemixReviewPage', () => {
  it('renders all 8 title variations', () => {
    render(
      <RemixReviewPage
        videoId="vid-1"
        projectId="proj-1"
        titles={mockTitles}
        thumbnails={mockThumbnails}
        scenes={mockScenes}
      />
    );
    expect(screen.getAllByText(/Title variation \d+/)).toHaveLength(8);
  });

  it('renders Approve & Continue button disabled when no thumbnail is selected', () => {
    render(
      <RemixReviewPage
        videoId="vid-1"
        projectId="proj-1"
        titles={mockTitles}
        thumbnails={mockThumbnails}
        scenes={mockScenes}
      />
    );
    const approveButton = screen.getByRole('button', { name: /approve/i });
    // hasThumbnailSelected is false (none selected) → button should be disabled
    expect(approveButton).toBeDisabled();
  });

  it('renders the approval checklist with 3 items', () => {
    render(
      <RemixReviewPage
        videoId="vid-1"
        projectId="proj-1"
        titles={mockTitles}
        thumbnails={mockThumbnails}
        scenes={mockScenes}
      />
    );
    expect(screen.getByText('Title selected')).toBeInTheDocument();
    expect(screen.getByText('Thumbnail selected')).toBeInTheDocument();
    expect(screen.getByText('Script reviewed')).toBeInTheDocument();
  });

  it('renders scene cards for each scene', () => {
    render(
      <RemixReviewPage
        videoId="vid-1"
        projectId="proj-1"
        titles={mockTitles}
        thumbnails={mockThumbnails}
        scenes={mockScenes}
      />
    );
    expect(screen.getByText('Scene 1')).toBeInTheDocument();
    expect(screen.getByText('Scene 2')).toBeInTheDocument();
  });
});

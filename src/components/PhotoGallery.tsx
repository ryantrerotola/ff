"use client";

import { useState } from "react";

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  uploadedBy?: { username: string } | null;
}

interface PhotoGalleryProps {
  flyPatternId: string;
  images: GalleryImage[];
}

export function PhotoGallery({ flyPatternId, images }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Suppress unused variable warning — flyPatternId available for future use
  void flyPatternId;

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Photos ({images.length})
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <img
                src={image.url}
                alt={image.caption || "Fly pattern photo"}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {(image.caption || image.uploadedBy) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-6">
                  {image.caption && (
                    <p className="truncate text-xs font-medium text-white">
                      {image.caption}
                    </p>
                  )}
                  {image.uploadedBy && (
                    <p className="truncate text-xs text-gray-300">
                      by {image.uploadedBy.username}
                    </p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <img
              src={selectedImage.url}
              alt={selectedImage.caption || "Fly pattern photo"}
              className="max-h-[80vh] rounded-lg object-contain"
            />

            {(selectedImage.caption || selectedImage.uploadedBy) && (
              <div className="mt-3 text-center">
                {selectedImage.caption && (
                  <p className="text-sm font-medium text-white">
                    {selectedImage.caption}
                  </p>
                )}
                {selectedImage.uploadedBy && (
                  <p className="mt-1 text-xs text-gray-400">
                    Uploaded by {selectedImage.uploadedBy.username}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

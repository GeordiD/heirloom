import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { uploadRecipePhotos } from '#/server/functions/recipes.functions';
import { useMutation } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface PhotoPreview {
  file: File;
  objectUrl: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function readFileAsBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to parse file data'));
        return;
      }
      resolve({ data: base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function AddRecipeFromPhotoModal({ open, onClose }: Props) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (files: PhotoPreview[]) => {
      const photoData = await Promise.all(files.map(({ file }) => readFileAsBase64(file)));
      return uploadRecipePhotos({ data: { photos: photoData } });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const newPreviews = files.map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPreviews]);

    // Reset input so the same file can be re-selected if removed
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClose = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.objectUrl));
    setPhotos([]);
    uploadMutation.reset();
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) handleClose();
  };

  const uploadId = uploadMutation.data?.uploadId ?? null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Recipe from Photo</DialogTitle>
        </DialogHeader>

        {uploadId ? (
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/20 dark:text-green-200">
              <p className="font-medium">
                {photos.length === 1 ? '1 photo' : `${photos.length} photos`} uploaded successfully!
              </p>
              <p className="mt-1 text-green-700 dark:text-green-300">
                AI processing will extract the recipe from your photos.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <div key={photo.objectUrl} className="group relative aspect-square">
                    <img
                      src={photo.objectUrl}
                      alt={`Recipe photo ${i + 1}`}
                      className="h-full w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove photo ${i + 1}`}
                      disabled={uploadMutation.isPending}
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:pointer-events-none"
                      onClick={() => removePhoto(i)}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              variant="outline"
              className="w-full"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {photos.length > 0 ? 'Add More Photos' : 'Select Photos'}
            </Button>

            {photos.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'} selected
              </p>
            )}

            {uploadMutation.isError && (
              <p className="text-sm text-destructive">Failed to upload photos. Please try again.</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" disabled={uploadMutation.isPending} onClick={handleClose}>
            {uploadId ? 'Done' : 'Cancel'}
          </Button>
          {!uploadId && photos.length > 0 && (
            <Button
              disabled={uploadMutation.isPending}
              onClick={() => uploadMutation.mutate(photos)}
            >
              {uploadMutation.isPending ? 'Uploading…' : 'Upload Photos'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

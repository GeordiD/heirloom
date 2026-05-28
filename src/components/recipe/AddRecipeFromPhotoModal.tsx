import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { processRecipePhotos, uploadRecipePhotos } from '#/server/functions/recipes.functions';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
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
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [phase, setPhase] = useState<'uploading' | 'extracting' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = useMutation({
    mutationFn: async (files: PhotoPreview[]) => {
      setPhase('uploading');
      const photoData = await Promise.all(files.map(({ file }) => readFileAsBase64(file)));
      const { uploadId } = await uploadRecipePhotos({ data: { photos: photoData } });
      setPhase('extracting');
      return processRecipePhotos({ data: { uploadId } });
    },
    onSuccess: (result) => {
      handleClose();
      void navigate({ to: '/recipes/$id', params: { id: String(result.id) } });
    },
    onSettled: () => setPhase(null),
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
    submitMutation.reset();
    onClose();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) handleClose();
  };

  const isPending = submitMutation.isPending;

  const pendingLabel =
    phase === 'uploading' ? 'Uploading…' : phase === 'extracting' ? 'Extracting recipe…' : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Recipe from Photo</DialogTitle>
        </DialogHeader>

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
                    disabled={isPending}
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
            disabled={isPending}
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

          {submitMutation.isError && (
            <p className="text-sm text-destructive">Failed to process photos. Please try again.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={isPending} onClick={handleClose}>
            Cancel
          </Button>
          {photos.length > 0 && (
            <Button disabled={isPending} onClick={() => submitMutation.mutate(photos)}>
              {pendingLabel ?? 'Upload Photos'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

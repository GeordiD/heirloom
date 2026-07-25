import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog';
import { processRecipeFile, uploadRecipeFile } from '#/server/functions/recipes.functions';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

function readFileAsBase64(file: File): Promise<string> {
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
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function AddRecipeFromFileModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<'uploading' | 'extracting' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = useMutation({
    mutationFn: async (selectedFile: File) => {
      setPhase('uploading');
      const data = await readFileAsBase64(selectedFile);
      const { uploadId } = await uploadRecipeFile({
        data: { data, fileName: selectedFile.name },
      });
      setPhase('extracting');
      return processRecipeFile({ data: { uploadId } });
    },
    onSuccess: (result) => {
      handleClose();
      void navigate({ to: '/recipes/$id', params: { id: String(result.id) } });
    },
    onSettled: () => setPhase(null),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    // Reset input so the same file can be re-selected if removed
    e.target.value = '';
  };

  const removeFile = () => setFile(null);

  const handleClose = () => {
    setFile(null);
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
          <DialogTitle>Add Recipe from File</DialogTitle>
        </DialogHeader>

        <div className="min-w-0 space-y-4">
          {file && (
            <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{file.name}</span>
              </div>
              <button
                type="button"
                aria-label="Remove file"
                disabled={isPending}
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:pointer-events-none"
                onClick={removeFile}
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.txt,.pdf,text/html,text/plain,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            variant="outline"
            className="w-full"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            {file ? 'Choose a Different File' : 'Select File'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Supports HTML, TXT, and PDF files
          </p>

          {submitMutation.isError && (
            <p className="text-sm text-destructive">
              {submitMutation.error instanceof Error
                ? submitMutation.error.message
                : 'Failed to process file. Please try again.'}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" disabled={isPending} onClick={handleClose}>
            Cancel
          </Button>
          {file && (
            <Button disabled={isPending} onClick={() => submitMutation.mutate(file)}>
              {pendingLabel ?? 'Upload File'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

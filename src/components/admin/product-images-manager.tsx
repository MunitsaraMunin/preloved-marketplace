"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageDropzone } from "@/components/admin/image-dropzone";
import {
  attachProductImages,
  deleteProductImage,
  setPrimaryImage,
} from "@/app/admin/products/actions";
import { uploadProductImageFile } from "@/lib/supabase/storage";
import type { ProductImage } from "@/types";

export function ProductImagesManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, startUpload] = useTransition();
  const [busyImageId, setBusyImageId] = useState<string | null>(null);

  function handleUpload() {
    if (pendingFiles.length === 0) return;

    startUpload(async () => {
      try {
        const uploaded = await Promise.all(
          pendingFiles.map((file) => uploadProductImageFile(productId, file)),
        );
        await attachProductImages(productId, uploaded);
        setPendingFiles([]);
        toast.success("Photos uploaded");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    });
  }

  async function handleDelete(imageId: string) {
    setBusyImageId(imageId);
    try {
      await deleteProductImage(productId, imageId);
      toast.success("Photo removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove photo");
    } finally {
      setBusyImageId(null);
    }
  }

  async function handleSetPrimary(imageId: string) {
    setBusyImageId(imageId);
    try {
      await setPrimaryImage(productId, imageId);
      toast.success("Primary photo updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update primary photo");
    } finally {
      setBusyImageId(null);
    }
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden bg-neutral-100">
              <Image
                src={image.image_url}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
              />
              {image.is_primary && (
                <span className="absolute left-1 top-1 rounded-sm bg-neutral-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Primary
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!image.is_primary && (
                  <button
                    type="button"
                    disabled={busyImageId === image.id}
                    onClick={() => handleSetPrimary(image.id)}
                    aria-label="Set as primary photo"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-neutral-700 hover:text-neutral-900"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      disabled={busyImageId === image.id}
                      aria-label="Delete photo"
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes it from the product permanently.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(image.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageDropzone files={pendingFiles} onChange={setPendingFiles} />

      {pendingFiles.length > 0 && (
        <Button type="button" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Uploading…" : `Upload ${pendingFiles.length} photo${pendingFiles.length > 1 ? "s" : ""}`}
        </Button>
      )}
    </div>
  );
}

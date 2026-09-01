"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  popupImageService,
  PopupImage,
  UploadPopupImageInput,
} from "@/services/popup-image.service";

/** Which per-card request is in flight, so only that card locks up. */
export type PendingAction = "activate" | "deactivate" | "delete";

export interface PopupImageFormData {
  title: string;
  alt_text: string;
  is_active: boolean;
}

const EMPTY_FORM: PopupImageFormData = {
  title: "",
  alt_text: "",
  is_active: false,
};

export function usePopupImages() {
  const [images, setImages] = useState<PopupImage[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload / edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<PopupImage | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<PopupImageFormData>({ ...EMPTY_FORM });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-card work: { id, action } while activate/deactivate/delete is running.
  const [pending, setPending] = useState<{ id: number; action: PendingAction } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PopupImage | null>(null);

  const activeImage = useMemo(
    () => images.find((image) => image.is_active) ?? null,
    [images]
  );

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await popupImageService.getPopupImages();
      setImages(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load popup images. Please check your connection."
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenUpload = () => {
    setEditingImage(null);
    setFile(null);
    setFormData({ ...EMPTY_FORM });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (image: PopupImage) => {
    setEditingImage(image);
    setFile(null);
    setFormData({
      title: image.title ?? "",
      alt_text: image.alt_text ?? "",
      is_active: image.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingImage(null);
    setFile(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingImage && !file) {
      setFormError("Pick an image to upload.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingImage) {
        // Metadata only — swapping the poster itself means uploading a new one.
        await popupImageService.updatePopupImage(editingImage.id, {
          title: formData.title.trim(),
          alt_text: formData.alt_text.trim(),
        });
      } else {
        const payload: UploadPopupImageInput = {
          title: formData.title.trim(),
          alt_text: formData.alt_text.trim(),
          is_active: formData.is_active,
        };
        await popupImageService.uploadPopupImage(file as File, payload);
      }
      await fetchData();
      handleCloseModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save the image.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Activating is a switch, not a toggle: the server stands the previous
   * holder down, so the list is refetched rather than patched locally — two
   * cards must never render as live at once.
   */
  const handleActivate = async (image: PopupImage) => {
    if (pending) return; // a double-click can't fire two requests
    setPending({ id: image.id, action: "activate" });
    setActionError(null);
    try {
      await popupImageService.activatePopupImage(image.id);
      await fetchData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to set the current image."
      );
    } finally {
      setPending(null);
    }
  };

  const handleDeactivate = async (image: PopupImage) => {
    if (pending) return;
    setPending({ id: image.id, action: "deactivate" });
    setActionError(null);
    try {
      await popupImageService.deactivatePopupImage(image.id);
      await fetchData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to turn the image off."
      );
    } finally {
      setPending(null);
    }
  };

  const openDelete = (image: PopupImage) => {
    setDeleteTarget(image);
    setActionError(null);
  };

  const closeDelete = () => setDeleteTarget(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setPending({ id: deleteTarget.id, action: "delete" });
    setActionError(null);
    try {
      await popupImageService.deletePopupImage(deleteTarget.id);
      await fetchData();
      closeDelete();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete the image."
      );
    } finally {
      setPending(null);
    }
  };

  return {
    images,
    activeImage,
    isRefreshing,
    error,
    fetchData,

    isModalOpen,
    editingImage,
    file,
    setFile,
    formData,
    setFormData,
    formError,
    isSubmitting,
    handleOpenUpload,
    handleOpenEdit,
    handleCloseModal,
    handleSubmit,

    pending,
    actionError,
    handleActivate,
    handleDeactivate,

    deleteTarget,
    openDelete,
    closeDelete,
    handleDelete,
  };
}

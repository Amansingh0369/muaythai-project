"use client";

import { useState, useEffect, useCallback } from "react";
import {
  locationService,
  Location,
  LocationImage,
  CreateLocationInput,
} from "@/services/location.service";

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateLocationInput>({
    name: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
  });

  // Gallery state (staged locally until save)
  const [newFiles, setNewFiles] = useState<File[]>([]); // files to upload
  const [existingImages, setExistingImages] = useState<LocationImage[]>([]); // kept images (edit mode)
  const [removeImageIds, setRemoveImageIds] = useState<number[]>([]); // ids to delete on save

  const resetGallery = useCallback(() => {
    setNewFiles([]);
    setExistingImages([]);
    setRemoveImageIds([]);
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length) setNewFiles((prev) => [...prev, ...images]);
  }, []);

  const removeNewFile = useCallback((index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Move an existing image into the "to delete" list (applied on save).
  const removeExistingImage = useCallback((imageId: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    setRemoveImageIds((prev) => (prev.includes(imageId) ? prev : [...prev, imageId]));
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await locationService.getLocations();
      setLocations(data);
      setError(null);
    } catch (err) {
      setError("Failed to load locations. Please check your connection.");
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setFormData({ name: "", address: "", city: "", latitude: "", longitude: "" });
    resetGallery();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      latitude: location.latitude?.toString() || "",
      longitude: location.longitude?.toString() || "",
    });
    resetGallery();
    setExistingImages(location.images ?? []);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingLocation(null);
    setFormData({ name: "", address: "", city: "", latitude: "", longitude: "" });
    resetGallery();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, formData, newFiles, removeImageIds);
      } else {
        await locationService.createLocation(formData, newFiles);
      }
      await fetchLocations();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "Error saving location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: number) => {
    setLocationToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (locationToDelete === null) return;
    setIsSubmitting(true);
    try {
      await locationService.deleteLocation(locationToDelete);
      await fetchLocations();
      setIsDeleteModalOpen(false);
      setLocationToDelete(null);
    } catch (err) {
      alert("Error deleting location");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    locations,
    isRefreshing,
    error,
    isAddModalOpen,
    isSubmitting,
    editingLocation,
    isDeleteModalOpen,
    formData,
    setFormData,
    newFiles,
    existingImages,
    addFiles,
    removeNewFile,
    removeExistingImage,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    handleSubmit,
    handleOpenDelete,
    handleDelete,
    setIsDeleteModalOpen,
    fetchLocations,
  };
}

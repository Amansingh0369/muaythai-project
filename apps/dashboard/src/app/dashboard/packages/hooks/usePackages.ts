"use client";

import { useState, useEffect, useCallback } from "react";
import { packageService, Package, CreatePackageInput } from "@/services/package.service";
import { locationService, Location } from "@/services/location.service";

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreatePackageInput>({
    name: "",
    description: "",
    price: "",
    duration_days: 7,
    location: 0,
    is_active: true,
  });

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [pkgs, locs] = await Promise.all([
        packageService.getPackages(),
        locationService.getLocations()
      ]);
      console.log("[Dashboard] Fetched Packages:", pkgs);
      setPackages(pkgs);
      setLocations(locs);
      setError(null);
    } catch (err) {
      setError("Failed to load data. Please check your connection.");
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingPackage(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      duration_days: 7,
      location: locations[0]?.id || 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    console.log("[Dashboard] Opening Edit for Package:", pkg);
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      duration_days: pkg.duration_days,
      location: pkg.location,
      is_active: pkg.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location) {
      alert("Please select a location for this camp.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingPackage) {
        await packageService.updatePackage(editingPackage.id, formData);
      } else {
        await packageService.createPackage(formData);
      }
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      alert(err.message || "Error saving package");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: number) => {
    console.log("[Dashboard] Initializing Delete for ID:", id);
    setPackageToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (packageToDelete === null) return;
    setIsSubmitting(true);
    try {
      await packageService.deletePackage(packageToDelete);
      await fetchData();
      setIsDeleteModalOpen(false);
      setPackageToDelete(null);
    } catch (err) {
      alert("Error deleting package");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    packages,
    locations,
    isRefreshing,
    error,
    isModalOpen,
    isSubmitting,
    editingPackage,
    isDeleteModalOpen,
    formData,
    setFormData,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    handleSubmit,
    handleOpenDelete,
    handleDelete,
    setIsDeleteModalOpen,
    fetchData,
  };
}

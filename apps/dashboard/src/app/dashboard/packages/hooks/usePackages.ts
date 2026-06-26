"use client";

import { useState, useEffect, useCallback } from "react";
import {
  packageService,
  Package,
  CreatePackageInput,
  PackageApiError,
  PackageFieldErrors,
} from "@/services/package.service";
import { locationService, Location } from "@/services/location.service";

const EMPTY_FORM: CreatePackageInput = {
  name: "",
  kind: "INDIVIDUAL",
  type: "BEGINNER",
  description: "",
  price: "",
  start_date: "",
  duration_days: 7,
  location_ids: [],
  ideal_for: [],
  training: [],
  experience: [],
  accommodation: [],
  included: [],
  is_active: true,
};

const cleanList = (arr: string[]): string[] =>
  (arr ?? []).map((s) => s.trim()).filter(Boolean);

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
  const [formData, setFormData] = useState<CreatePackageInput>({ ...EMPTY_FORM });
  // Inline validation: { location_ids: [...], ideal_for: [...], ... } + a top-level banner
  const [fieldErrors, setFieldErrors] = useState<PackageFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [pkgs, locs] = await Promise.all([
        packageService.getPackages(),
        locationService.getLocations()
      ]);
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
    setFieldErrors({});
    setFormError(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFieldErrors({});
    setFormError(null);
    setFormData({
      name: pkg.name,
      kind: pkg.kind ?? "INDIVIDUAL",
      type: pkg.type ?? "BEGINNER",
      description: pkg.description,
      price: pkg.price?.toString() ?? "",
      start_date: pkg.start_date ? pkg.start_date.slice(0, 10) : "",
      duration_days: pkg.duration_days,
      location_ids: (pkg.locations ?? []).map((l) => l.id),
      ideal_for: pkg.ideal_for ?? [],
      training: pkg.training ?? [],
      experience: pkg.experience ?? [],
      accommodation: pkg.accommodation ?? [],
      included: pkg.included ?? [],
      is_active: pkg.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
    setFieldErrors({});
    setFormError(null);
  };

  /** Client-side guard mirroring the server rule, so users get instant feedback. */
  const validate = (): boolean => {
    const errs: PackageFieldErrors = {};
    const count = formData.location_ids.length;
    if (formData.kind === "INDIVIDUAL" && count !== 1) {
      errs.location_ids = ["An individual package must have exactly one location."];
    } else if (formData.kind === "GROUP" && count < 2) {
      errs.location_ids = ["A group package must have at least two locations."];
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const payload: CreatePackageInput = {
      ...formData,
      start_date: formData.start_date ? formData.start_date : null,
      ideal_for: cleanList(formData.ideal_for),
      training: cleanList(formData.training),
      experience: cleanList(formData.experience),
      accommodation: cleanList(formData.accommodation),
      included: cleanList(formData.included),
    };

    setIsSubmitting(true);
    try {
      if (editingPackage) {
        await packageService.updatePackage(editingPackage.id, payload);
      } else {
        await packageService.createPackage(payload);
      }
      await fetchData();
      handleCloseModal();
    } catch (err: any) {
      if (err instanceof PackageApiError) {
        setFieldErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError(err?.message || "Error saving package");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (id: number) => {
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
    fieldErrors,
    formError,
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

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  couponService,
  Coupon,
  CouponApiError,
  CouponFieldErrors,
  CouponFormData,
  CreateCouponInput,
} from "@/services/coupon.service";
import { fromDateTimeLocalInput, toDateTimeLocalInput } from "../coupon.helpers";

const EMPTY_FORM: CouponFormData = {
  code: "",
  description: "",
  discount_type: "PERCENTAGE",
  value: "",
  max_discount_amount: "",
  min_order_amount: "",
  valid_from: "",
  valid_until: "",
  max_redemptions: "",
  is_active: true,
};

/** Optional amounts must clear as null — "" is rejected by the DecimalFields. */
const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState<CouponFormData>({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<CouponFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Retire flow — deactivate or delete, sharing one modal.
  const [retireTarget, setRetireTarget] = useState<Coupon | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [retireError, setRetireError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await couponService.getCoupons();
      setCoupons(data);
      setError(null);
    } catch (err) {
      setError("Failed to load coupons. Please check your connection.");
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFieldErrors({});
    setFormError(null);
    setFormData({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFieldErrors({});
    setFormError(null);
    setFormData({
      code: coupon.code,
      description: coupon.description ?? "",
      discount_type: coupon.discount_type,
      value: coupon.value ?? "",
      max_discount_amount: coupon.max_discount_amount ?? "",
      min_order_amount: coupon.min_order_amount ?? "",
      valid_from: toDateTimeLocalInput(coupon.valid_from),
      valid_until: toDateTimeLocalInput(coupon.valid_until),
      max_redemptions:
        coupon.max_redemptions === null ? "" : String(coupon.max_redemptions),
      is_active: coupon.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const maxRedemptions = formData.max_redemptions.trim();

    const payload: CreateCouponInput = {
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim(),
      discount_type: formData.discount_type,
      value: formData.value.trim(),
      min_order_amount: blankToNull(formData.min_order_amount),
      valid_from: fromDateTimeLocalInput(formData.valid_from),
      valid_until: fromDateTimeLocalInput(formData.valid_until),
      max_redemptions: maxRedemptions === "" ? null : Number(maxRedemptions),
      is_active: formData.is_active,
    };

    // A cap is meaningless on a flat-rupee coupon and the server rejects it outright,
    // so the key is left off the payload rather than sent as null.
    if (formData.discount_type === "PERCENTAGE") {
      payload.max_discount_amount = blankToNull(formData.max_discount_amount);
    }

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, payload);
      } else {
        await couponService.createCoupon(payload);
      }
      await fetchData();
      handleCloseModal();
    } catch (err) {
      if (err instanceof CouponApiError) {
        setFieldErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Error saving coupon");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRetire = (coupon: Coupon) => {
    setRetireTarget(coupon);
    setConflictMessage(null);
    setRetireError(null);
  };

  const closeRetire = () => {
    setRetireTarget(null);
    setConflictMessage(null);
    setRetireError(null);
  };

  const handleDelete = async () => {
    if (!retireTarget) return;
    setIsSubmitting(true);
    setConflictMessage(null);
    setRetireError(null);
    try {
      await couponService.deleteCoupon(retireTarget.id);
      await fetchData();
      closeRetire();
    } catch (err) {
      if (err instanceof CouponApiError && err.isConflict) {
        // Expected outcome, not a crash: keep the modal open and pivot to deactivation.
        setConflictMessage(err.message);
      } else {
        setRetireError(
          err instanceof Error ? err.message : "Failed to delete coupon."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!retireTarget) return;
    setIsSubmitting(true);
    setRetireError(null);
    try {
      await couponService.updateCoupon(retireTarget.id, { is_active: false });
      await fetchData();
      closeRetire();
    } catch (err) {
      setRetireError(
        err instanceof Error ? err.message : "Failed to deactivate coupon."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    coupons,
    isRefreshing,
    error,
    isModalOpen,
    isSubmitting,
    editingCoupon,
    formData,
    setFormData,
    fieldErrors,
    formError,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    handleSubmit,
    fetchData,
    retireTarget,
    openRetire,
    closeRetire,
    conflictMessage,
    retireError,
    handleDelete,
    handleDeactivate,
  };
}

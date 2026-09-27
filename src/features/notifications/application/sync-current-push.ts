"use client";
import { updatePushSubscription } from "./subscription-actions";

export async function syncCurrentPush() {
  if (!("serviceWorker" in navigator) || !("Notification" in window) || Notification.permission !== "granted") return true;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return !subscription || (await updatePushSubscription(subscription.toJSON(), true)).ok;
}

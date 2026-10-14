"use client";

import React from "react";
import Image from "next/image";

export type OtaPlatformId = "booking_com" | "agoda" | "expedia" | "airbnb" | "trip_com" | "direct" | string;

export function BookingComLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-xl bg-[#003580] flex items-center justify-center ${className}`}>
      <img
        src="/ota/booking.png"
        alt="Booking.com"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function AgodaLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-xl bg-white border border-stone-100 dark:border-stone-800 flex items-center justify-center ${className}`}>
      <img
        src="/ota/agoda.png"
        alt="Agoda"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function ExpediaLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-xl bg-[#fcbb04] flex items-center justify-center ${className}`}>
      <img
        src="/ota/expedia.png"
        alt="Expedia"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function AirbnbLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-xl bg-[#FF5A5F] flex items-center justify-center ${className}`}>
      <img
        src="/ota/airbnb.png"
        alt="Airbnb"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function TripComLogo({ className = "w-full h-full" }: { className?: string }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-xl bg-[#287DFA] flex items-center justify-center ${className}`}>
      <img
        src="/ota/trip.png"
        alt="Trip.com"
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

/**
 * Universal OTA Logo Component
 * Accepts channelId (e.g. "booking_com", "agoda", "expedia", "airbnb", "trip_com")
 * or channelName (e.g. "Booking.com", "Agoda", "Expedia", "Airbnb", "Trip.com")
 */
export function OtaLogo({
  channel,
  className = "w-12 h-12",
}: {
  channel: string;
  className?: string;
}) {
  const norm = (channel || "").toLowerCase().trim();

  if (norm.includes("book") || norm === "booking_com" || norm === "booking") {
    return (
      <div className={`${className} shrink-0 aspect-square overflow-hidden rounded-2xl shadow-sm transition-transform hover:scale-105`}>
        <BookingComLogo />
      </div>
    );
  }

  if (norm.includes("agoda")) {
    return (
      <div className={`${className} shrink-0 aspect-square overflow-hidden rounded-2xl shadow-sm transition-transform hover:scale-105`}>
        <AgodaLogo />
      </div>
    );
  }

  if (norm.includes("expedia")) {
    return (
      <div className={`${className} shrink-0 aspect-square overflow-hidden rounded-2xl shadow-sm transition-transform hover:scale-105`}>
        <ExpediaLogo />
      </div>
    );
  }

  if (norm.includes("airbnb")) {
    return (
      <div className={`${className} shrink-0 aspect-square overflow-hidden rounded-2xl shadow-sm transition-transform hover:scale-105`}>
        <AirbnbLogo />
      </div>
    );
  }

  if (norm.includes("trip")) {
    return (
      <div className={`${className} shrink-0 aspect-square overflow-hidden rounded-2xl shadow-sm transition-transform hover:scale-105`}>
        <TripComLogo />
      </div>
    );
  }

  // Fallback direct / walk-in
  return (
    <div className={`${className} shrink-0 aspect-square overflow-hidden rounded-2xl shadow-sm bg-stone-800 text-white flex items-center justify-center font-bold text-sm`}>
      {channel ? channel.slice(0, 2).toUpperCase() : "OTA"}
    </div>
  );
}

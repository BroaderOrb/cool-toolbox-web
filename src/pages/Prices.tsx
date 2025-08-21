import React from "react";
import MultiAssetPriceChart from "@/features/prices/components/MultiAssetPriceChart";

export default function PricesPage() {
  return (
    <div className="p-4 md:p-6">
      <MultiAssetPriceChart />
    </div>
  );
}
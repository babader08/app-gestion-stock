import React from "react";

// Composant réutilisable pour afficher une carte de statistique épurée
const SimpleStatsCard = ({ Icon, title, value, bgIcon }) => {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${bgIcon}`}
      >
        {Icon}
      </div>

      <div className="flex flex-col">
        <p className="text-sm font-medium tracking-wide text-gray-500 uppercase">
          {title}
        </p>

        <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
};

export default SimpleStatsCard;

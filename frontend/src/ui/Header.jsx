import React from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useUser } from "../hooks";

const Header = ({ onMenuClick }) => {
  const { data: user } = useUser();

  return (
    <header className="bg-white shadow">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="inline-flex items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 lg:hidden"
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-bold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">Utilisateur</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

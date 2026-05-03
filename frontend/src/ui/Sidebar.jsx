import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Package, LayoutDashboard, Boxes, LogOut, X } from "lucide-react";

import { useLogout } from "../hooks";
import { AuthContext } from "../contexts/AuthContext";
import ConfirmDialog from "./Confirmdialog";

const Sidebar = ({ isOpen, onClose, items = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mutate: logout, isPending } = useLogout();
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const defaultItems = [
    {
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: <Boxes size={18} />,
      label: "Products",
      path: "/products",
    },
  ];

  const menuItems = items.length > 0 ? items : defaultItems;

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        setIsAuthenticated(false);
        setUser(null);
        navigate("/");
        console.log("déconnexion réussie");
      },
      onError: (err) => {
        console.log("eee", err);
        const message = err?.response?.data?.error || "Une erreur est survenue";
        console.error(message);
      },
    });
  };

  const btnLogout = () => {
    setLogoutOpen(true);
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden w-64 shrink-0 bg-linear-to-b from-blue-700 via-blue-600 to-blue-800 lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
            <Package className="text-white" size={20} />
          </div>

          <span className="text-xl font-bold tracking-wide text-white">
            StorePro
          </span>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-2 px-4 py-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-white text-blue-700 shadow-lg"
                    : "text-blue-100 hover:translate-x-1 hover:bg-white/10"
                }`}
              >
                <span
                  className={`transition-transform duration-300 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={btnLogout}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-blue-700"
          >
            <LogOut
              size={18}
              className="transition-transform group-hover:-translate-x-1"
            />

            {isPending ? "Déconnexion..." : "Déconnexion"}
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-linear-to-b from-blue-700 via-blue-600 to-blue-800 transition-all duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Package className="text-white" size={18} />
            </div>

            <span className="text-lg font-bold text-white">StorePro</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white transition hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-2 px-4 py-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-white text-blue-700 shadow-lg"
                    : "text-blue-100 hover:bg-white/10"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute right-0 bottom-0 left-0 border-t border-white/10 p-4">
          <button
            onClick={btnLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-blue-700"
          >
            <LogOut size={18} />
            {isPending ? "Déconnexion..." : "Déconnexion"}
          </button>
        </div>
      </div>
      <ConfirmDialog
        isOpen={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => handleLogout()}
        title="Se déconnecter"
        message="Voulez-vous vraiment vous déconnecter ?"
        confirmLabel="Se déconnecter"
        variant="warning"
      />
    </>
  );
};

export default Sidebar;

import React, { useState } from "react";
import Sidebar from "../ui/Sidebar";
import Header from "../ui/Header";
import { Outlet } from "react-router-dom";

const DashboardLayout = ({ sidebarItems = [] }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={sidebarItems}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:p-3">
          <div className="mx-auto max-w-7xl">
            {" "}
            <Outlet />{" "}
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;

import React from "react";
import SimpleStatsCard from "../components/SimpleStatsCard";
import { Package, Wallet, TrendingUp, Layers } from "lucide-react";
import RevenueChart from "../components/RevenueChart";
import StockChart from "../components/StockChart";
import RecentProductsTable from "../components/RecentProductsTable";
import { useStats } from "../hooks/useProduct";
import { formatValue } from "../utils/fonctionData";

const Dashboard = () => {
  const { data: stats, isLoading, isError } = useStats();

  const cards = [
    {
      Icon: <Package color="#3b82f6" />,
      title: "Total Produits",
      value: formatValue(stats?.total_produits, isLoading, isError),
      bgIcon: "bg-blue-50",
    },
    {
      Icon: <Wallet color="#22c55e" />,
      title: "Dépenses Estimées",
      value: formatValue(stats?.depenses_estimees, isLoading, isError),
      bgIcon: "bg-green-50",
    },
    {
      Icon: <TrendingUp color="#f97316" />,
      title: "Revenus Estimés",
      value: formatValue(stats?.revenus_estimes, isLoading, isError),
      bgIcon: "bg-orange-50",
    },
    {
      Icon: <Layers color="#a855f7" />,
      title: "Total Stock",
      value: formatValue(stats?.total_stock, isLoading, isError),
      bgIcon: "bg-purple-50",
    },
  ];

  return (
    <div className="py-6">
      <div className="mb-6 pl-5">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Aperçu des performances et des produits de votre magasin !
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-5 lg:grid-cols-4">
        {cards.map((card, index) => (
          <SimpleStatsCard key={index} {...card} />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:px-6">
        <RevenueChart
          depenses={stats?.depenses_estimees}
          revenus={stats?.revenus_estimes}
        />
        <StockChart enStock={stats?.en_stock} enRupture={stats?.en_rupture} />
      </div>

      <div className="mt-8 lg:px-6">
        <RecentProductsTable />
      </div>
    </div>
  );
};

export default Dashboard;

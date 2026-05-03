import React from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { useDashboardProducts } from "../hooks/useProduct";
import { formatDate } from "../utils/fonctionData";

const RecentProductsTable = () => {
  const { data, isLoading, isError } = useDashboardProducts();

  const products = data?.data?.data?.products || [];

  if (isLoading) {
    return (
      <div className="mt-8 flex h-48 w-full items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm">
        <span className="text-gray-500">
          Chargement des derniers produits...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-8 flex h-48 w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 shadow-sm">
        <span className="text-red-500">
          Une erreur est survenue lors de la récupération des produits.
        </span>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-4 sm:flex-row sm:p-6">
        <h3 className="sm:text-md flex items-center gap-2 text-base font-bold whitespace-nowrap text-gray-900">
          <span>
            Produits Récents{" "}
            <span className="text-xs font-medium text-gray-500">
              {products.length}
            </span>
          </span>
        </h3>
        <Link
          to="/products"
          className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 sm:text-base"
        >
          Voir tous les produits →
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Aucun produit n'a encore été ajouté.</p>
          <Link
            to="/products/new"
            className="mt-4 text-sm font-medium text-blue-600 hover:underline"
          >
            Ajouter un premier produit
          </Link>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-xs font-semibold tracking-wider text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">Produit</th>
                <th className="px-6 py-4">Etiquette</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 whitespace-nowrap">Prix d'achat</th>
                <th className="px-6 py-4 whitespace-nowrap">Date d'ajout</th>
                <th className="px-6 py-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                          <Package size={20} />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">
                        {product.productName}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {product.etiquette}
                  </td>

                  <td className="px-6 py-4 text-gray-600 capitalize">
                    {product.category}
                  </td>

                  <td
                    className={`px-6 py-4 font-medium ${product.stock <= 5 ? "text-red-600" : "text-gray-600"}`}
                  >
                    {product.stock}
                  </td>

                  <td className="px-6 py-4 font-medium text-gray-900">
                    {product.purchasePrice.toLocaleString()}{" "}
                  </td>

                  <td className="px-6 py-4 text-gray-600">
                    {formatDate(product.createdAt)}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                        product.status === "En Stock"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentProductsTable;

import React, { useState } from "react";
import { Edit2, Trash2, Package, Loader2 } from "lucide-react";
import {
  useAllProducts,
  useDeleteProduct,
  useUpdateProduct,
} from "../hooks/useProduct";
import ConfirmDialog from "../ui/Confirmdialog";
import EditProductModal from "./EditProductModal";
import toast from "react-hot-toast";


const AllProducts = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
  });


  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
  } = useAllProducts(filters);
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const { mutate: deleteProduct } = useDeleteProduct();

  const handleDelete = (product) => {
    setProductToDelete(product);
    setConfirmOpen(true);
  };

  const handleUpdate = (formData) => {
    updateProduct(
      { id: selectedProduct?.id, data: formData },
      {
        onSuccess: () => {
          document.getElementById("edit_modal").close();
          toast.success("Votre produit a été modifie avec succès");
          setSelectedProduct(null);
        },
      },
    );
  };

  if (isLoading) {
    return <div className="p-10 text-center">Chargement...</div>;
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-red-500">
        Erreur lors du chargement des produits.
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:mr-2 md:ml-2 lg:mr-2 lg:ml-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs md:flex-1">
          <svg
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search products..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-9 text-sm text-slate-700 placeholder-slate-400 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="px-2 text-sm font-semibold text-slate-600">
              Filters
            </span>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:w-auto"
              >
                <option value="">Toutes les catégories</option>
                <option value="Électronique">Électronique</option>
                <option value="Vêtements">Vêtements</option>
                <option value="food">Alimentation</option>
                <option value="Mobilier">Mobilier</option>
                <option value="Autre">Autre</option>
              </select>

              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:w-auto"
              >
                <option value="">Tous les statuts</option>
                <option value="En Stock">En Stock</option>
                <option value="Rupture">Rupture</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-5 w-full overflow-x-auto">
        {isFetching && !isFetchingNextPage && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        )}

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Produit</th>
              <th className="px-6 py-4">Etiquette</th>
              <th className="px-6 py-4">Catégorie</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 whitespace-nowrap">Prix d'achat</th>
              <th className="px-6 py-4 whitespace-nowrap">Prix d'unité</th>
              <th className="px-6 py-4 whitespace-nowrap">Date d'ajout</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {
              data?.pages.flatMap((page) => page.data?.products ?? []).length ===
            0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Package size={36} strokeWidth={1.5} />
                    <span className="text-sm font-medium">
                      Aucun produit trouvé
                    </span>
                    {filters.search && (
                      <span className="text-xs">
                        Aucun résultat pour "<strong>{filters.search}</strong>"
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data?.pages.map((page, index) => (
                <React.Fragment key={index}>
                  {page.data?.products?.map((product) => (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl === "pasImage" ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                              <Package size={20} />
                            </div>
                          ) : (
                            <img
                              src={product.imageUrl}
                              alt={product.productName}
                              className="h-10 w-10 rounded-lg border border-gray-200 object-cover"
                            />
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
                        className={`px-6 py-4 ${
                          product.stock <= 5
                            ? "font-bold text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.purchasePrice} F
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.SellingPrice} F
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(product.createdAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-lg border p-1 text-[10px] font-semibold whitespace-nowrap ${
                            product.status === "En Stock"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                            }}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        {selectedProduct && (
          <EditProductModal
            key={selectedProduct.id}
            product={selectedProduct}
            onSubmit={handleUpdate}
            isPending={isUpdating}
          />
        )}
        <ConfirmDialog
          isOpen={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => deleteProduct(productToDelete?.id)}
          title="Supprimer le produit"
          message={`Voulez-vous supprimer "${productToDelete?.productName}" ?`}
          confirmLabel="Oui, supprimer"
          cancelLabel="Annuler"
          variant="danger"
        />
        <div className="sticky right-0 bottom-0 left-0 z-10 flex justify-center border-t border-gray-100 bg-white p-6">
          {hasNextPage ? (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Chargement...
                </>
              ) : (
                "Charger plus de produits"
              )}
            </button>
          ) : (
            data?.pages.flatMap((p) => p.data?.products ?? []).length > 0 && (
              <span className="text-sm text-gray-400">
                Tous les produits ont été chargés.
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AllProducts;

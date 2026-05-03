import { useEffect } from "react";
import { useForm } from "react-hook-form";

export default function EditProductModal({ product, onSubmit, isPending }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productName: product?.productName || "",
      etiquette: product?.etiquette || "",
      category: product?.category || "",
      stock: product?.stock || 0,
      purchasePrice: product?.purchasePrice || 0,
      sellingPrice: product?.SellingPrice || 0,
      status: product?.status || "", // ✅ ajoute ça
    },
  });

  useEffect(() => {
    const modal = document.getElementById("edit_modal");
    if (modal) modal.showModal();
  }, []);

  const inputBase =
    "h-9 w-full rounded-lg border px-3 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none";

  return (
    <dialog id="edit_modal" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <h3 className="mb-4 text-lg font-bold">
          Modifier : {product?.productName}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="mx-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Nom du produit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Montre S8 Pro"
                {...register("productName", { required: "Requis" })}
                className={`${inputBase} ${errors.productName ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.productName && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.productName.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Etiquette <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: SW-1280-BLK"
                {...register("etiquette", { required: "Requis" })}
                className={`${inputBase} ${errors.etiquette ? "border-red-400" : "border-gray-300"}`}
              />
              {errors.etiquette && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.etiquette.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Catégorie <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register("category", { required: "Requis" })}
                  className={`h-9 w-full appearance-none rounded-lg border bg-white pr-8 pl-3 text-sm text-gray-800 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${errors.category ? "border-red-400" : "border-gray-300"}`}
                >
                  <option value="">Choisir...</option>
                  <option value="Électronique">Électronique</option>
                  <option value="Vêtements">Vêtements</option>
                  <option value="Alimentation">Alimentation</option>
                  <option value="Mobilier">Mobilier</option>
                  <option value="Autre">Autre</option>
                </select>
                <svg
                  className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {errors.category && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Stock <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-0 left-0 flex h-full w-9 items-center justify-center rounded-l-lg border-r border-gray-300 bg-gray-50 text-[11px] text-gray-500">
                  #
                </span>
                <input
                  type="number"
                  min="0"
                  {...register("stock", {
                    required: "Requis",
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    min: { value: 0, message: "Positif" },
                  })}
                  className={`${inputBase} pr-3 pl-11 ${errors.stock ? "border-red-400" : "border-gray-300"}`}
                />
              </div>
              {errors.stock && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Prix d'achat (par article){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-0 left-0 flex h-full w-9 items-center justify-center rounded-l-lg border-r border-gray-300 bg-gray-50 text-xs text-gray-500">
                  ₣
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  {...register("purchasePrice", {
                    required: "Requis",
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    min: { value: 0, message: "Positif" },
                  })}
                  className={`${inputBase} pr-3 pl-11 ${errors.purchasePrice ? "border-red-400" : "border-gray-300"}`}
                />
              </div>
              {errors.purchasePrice && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.purchasePrice.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Prix de vente (par article){" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute top-0 left-0 flex h-full w-9 items-center justify-center rounded-l-lg border-r border-gray-300 bg-gray-50 text-xs text-gray-500">
                  ₣
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  {...register("sellingPrice", {
                    required: "Requis",
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    min: { value: 0, message: "Positif" },
                  })}
                  className={`${inputBase} pr-3 pl-11 ${errors.unitPrice ? "border-red-400" : "border-gray-300"}`}
                />
              </div>
              {errors.unitPrice && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                Statut <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register("status", { required: "Requis" })}
                  className={`h-9 w-full appearance-none rounded-lg border bg-white pr-8 pl-3 text-sm text-gray-800 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${errors.status ? "border-red-400" : "border-gray-300"}`}
                >
                  <option value="">Choisir...</option>
                  <option value="En Stock">En Stock</option>
                  <option value="Rupture">Rupture</option>
                </select>
                <svg
                  className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {errors.status && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all duration-200 ${
                isPending
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {isPending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

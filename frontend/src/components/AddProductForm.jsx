/* eslint-disable react-hooks/refs */
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { useCreateProduct, useUploadImage } from "../hooks";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { useQueryClient } from "@tanstack/react-query";

export default function AddProductForm() {
  const [imagePreview, setImagePreview] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);
  const [imageUrl, setImageUrl] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productName: "",
      etiquette: "",
      category: "",
      purchasePrice: "",
      unitPrice: "",
      stock: "",
    },
  });
  const { mutate: uploadImage, isPending: pendingImage } = useUploadImage();
  const { mutate: createProduct, isPending } = useCreateProduct();
  const queryClient = useQueryClient();

  const handleImageChange = async (e) => {
    const image = e.target.files[0];
    if (!image) return;

    if (image.size > 2 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 2 Mo");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(image);

    const compressed = await imageCompression(image, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      initialQuality: 0.8,
    });

    uploadImage(compressed, {
      onSuccess: (response) => {
        setImageUrl(response.url);
      },
      onError: () => {
        toast.error("Erreur lors du chargement de la photo");
        setImagePreview(null);
        setImageUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  const onSubmit = (data) => {
    const productData = {
      product_name: data.productName,
      etiquette: data.etiquette,
      category: data.category,
      status: "En Stock",
      purchase_price: Number(data.purchasePrice),
      selling_price: Number(data.unitPrice),
      stock: Number(data.stock),
      image_url: imageUrl || "pasImage",
    };

    createProduct(productData, {
      onSuccess: () => {
        toast.success("Votre produit a été ajouté avec succès");
        reset();
        setImagePreview(null);
        setImageUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      },
      onError: () => {
        toast.error("Une erreur est survenue de notre part");
      },
    });
  };

  return (
    <div className="md:mx-2 lg:mx-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Nouveau produit
                </p>
                <p className="text-xs text-gray-500">
                  Remplissez les informations du produit
                </p>
              </div>
            </div>

            {/* Bouton desktop */}
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="submit"
                disabled={isPending || pendingImage}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <svg
                  className="h-3.5 w-3.5"
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
                {isPending ? "En cours..." : "Enregistrer"}
              </button>
            </div>

            {/* Bouton toggle mobile */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
              aria-label={isExpanded ? "Réduire" : "Ajouter un produit"}
            >
              <span className="text-xs font-medium">
                {isExpanded ? "Réduire" : "Ajouter"}
              </span>
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
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
            </button>
          </div>

          {/* Corps du formulaire */}
          <div className={`${isExpanded ? "block" : "hidden"} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px]">
              <div className="border-b border-gray-200 p-5 md:border-r md:border-b-0">
                <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                      Nom du produit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Montre S8 Pro"
                      {...register("productName", { required: "Requis" })}
                      className={`h-9 w-full rounded-lg border px-3 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${errors.productName ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors.productName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.productName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                      Étiquette <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Chemise Blanc taille 12"
                      {...register("etiquette", { required: "Requis" })}
                      className={`h-9 w-full rounded-lg border px-3 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${errors.etiquette ? "border-red-400" : "border-gray-300"}`}
                    />
                    {errors.etiquette && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.etiquette.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
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
                        <option value="food">Alimentation</option>
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
                          min: { value: 0, message: "Positif" },
                        })}
                        className={`h-9 w-full rounded-lg border pr-3 pl-11 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${errors.purchasePrice ? "border-red-400" : "border-gray-300"}`}
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
                        {...register("unitPrice", {
                          required: "Requis",
                          min: { value: 0, message: "Positif" },
                        })}
                        className={`h-9 w-full rounded-lg border pr-3 pl-11 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${errors.unitPrice ? "border-red-400" : "border-gray-300"}`}
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
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute top-0 left-0 flex h-full w-9 items-center justify-center rounded-l-lg border-r border-gray-300 bg-gray-50 text-[11px] text-gray-500">
                        #
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...register("stock", {
                          required: "Requis",
                          min: { value: 0, message: "Positif" },
                        })}
                        className={`h-9 w-full rounded-lg border pr-3 pl-11 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${errors.stock ? "border-red-400" : "border-gray-300"}`}
                      />
                    </div>
                    {errors.stock && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.stock.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Statut :</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    En stock
                  </span>
                </div>
              </div>

              {/* Zone image */}
              <div className="flex flex-col p-5">
                <label className="mb-2 block text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                  Image produit
                </label>
                <div
                  onClick={() => !pendingImage && fileInputRef.current.click()}
                  className="flex min-h-35 flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 transition-all hover:border-blue-400 hover:bg-blue-50/30"
                >
                  {pendingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <p className="text-xs text-gray-400">
                        Upload en cours...
                      </p>
                    </div>
                  ) : imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                        <svg
                          className="h-4 w-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600">
                        Cliquer pour importer
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        PNG, JPG · max 2 Mo
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Bouton mobile */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3.5 lg:hidden">
              <button
                type="submit"
                disabled={isPending || pendingImage}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <svg
                  className="h-3.5 w-3.5"
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
                {isPending ? "En cours..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

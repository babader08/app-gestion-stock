import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useResetPassword } from "../hooks";

const NewPasswordStep = ({ onSuccess, onBack }) => {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { mutate: resetPassword, isPending } = useResetPassword();

  const handleReset = (e) => {
    e.preventDefault();

    if (!code) {
      setError("Veuillez entrer le code de sécurité reçu.");
      return;
    }

    if (!password || password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setError("");

    resetPassword(
      { code, newPassword: password },
      {
        onSuccess: () => onSuccess(),
        onError: (err) => {
          const errorData = err?.response?.data?.data;
          if (errorData?.new_password) {
            setError(errorData.new_password[0]);
          } else {
            setError(
              err?.response?.data?.error ||
                "Une erreur est survenue lors de la réinitialisation.",
            );
          }
        },
      },
    );
  };

  // Disparition automatique de l'erreur après 5 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    // WRAPPER PRINCIPAL : Centre le contenu sur tout l'écran avec un fond gris
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
      {/* LA CARTE BLANCHE */}
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <KeyRound size={24} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Veuillez entrer le code à 6 chiffres reçu par email pour sécuriser
            votre compte.
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          {/* Bannière d'erreur animée */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${error ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>

          {/* Champ Code */}
          <div className="space-y-2">
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700"
            >
              Code de sécurité
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="token"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                disabled={isPending}
                placeholder="Ex: 123456"
                className={`block w-full rounded-xl border py-3 pr-4 pl-10 text-gray-900 transition-all duration-200 outline-none placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 sm:text-sm ${
                  error && !code
                    ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                }`}
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Nouveau mot de passe
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="Minimum 8 caractères"
                className={`block w-full rounded-xl border py-3 pr-12 pl-10 text-gray-900 transition-all duration-200 outline-none placeholder:text-gray-400 disabled:bg-gray-50 sm:text-sm ${
                  error && password.length < 8 && password.length > 0
                    ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                }`}
              />
              {/* Bouton Afficher/Masquer */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Indicateur de longueur */}
            {password && password.length < 8 && (
              <p className="text-xs font-medium text-amber-600 transition-all">
                Encore {8 - password.length} caractère
                {8 - password.length > 1 ? "s" : ""} requis.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              disabled={isPending}
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 sm:w-1/3"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Retour
            </button>

            <button
              type="submit"
              disabled={isPending || password.length < 8 || !code}
              className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 sm:w-2/3 ${
                isPending || password.length < 8 || !code
                  ? "cursor-not-allowed bg-blue-400 shadow-none"
                  : "bg-blue-600 shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]"
              }`}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Modification...
                </span>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPasswordStep;

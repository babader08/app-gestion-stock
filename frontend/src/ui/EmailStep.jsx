import React, { useState, useEffect } from "react";
import { Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { useRequestPasswordReset } from "../hooks";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const EmailStep = ({ email, setEmail, onNext }) => {
  const [error, setError] = useState("");

  const { mutate: requestPasswordReset, isPending } = useRequestPasswordReset();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setError("L'adresse email est requise.");
      return;
    }

    if (!email.includes("@")) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }

    setError("");

    requestPasswordReset(
      { email },
      {
        onSuccess: (response) => {
          onNext();
          console.log(response);
          toast.success(
            "Si vous avez un compte, vous recevez un code de réinitialisation ",
            {
              style: { minWidth: "400px", maxWidth: "600px" },
              duration: 6000,
            },
          );
        },
        onError: (err) => {
          const message =
            err?.response?.data?.error ||
            "Une erreur est survenue lors de la demande.";
          setError(message);
          console.error("Erreur password reset:", err);
        },
      },
    );
  };

  // Disparition automatique de l'erreur alignée sur 5 secondes comme l'autre composant
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    // WRAPPER PRINCIPAL : Centre le contenu sur tout l'écran
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
      {/* LA CARTE BLANCHE */}
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Mail size={24} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Mot de passe oublié ?
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Entrez votre adresse email pour recevoir un code de sécurité à 6
            chiffres.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bannière d'erreur animée */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${error ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>

          {/* Champ Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Adresse Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                placeholder="exemple@cabinet.com"
                className={`block w-full rounded-xl border py-3 pr-4 pl-10 text-gray-900 transition-all duration-200 outline-none placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400 sm:text-sm ${
                  error
                    ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-gray-200 bg-gray-50/50 hover:bg-gray-50 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                }`}
              />
            </div>
          </div>

          <div className="space-y-5 pt-2">
            <button
              type="submit"
              disabled={isPending || !email}
              className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 ${
                isPending || !email
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
                  Envoi du code...
                </span>
              ) : (
                "Envoyer le code"
              )}
            </button>
            <Link to={"/"}>
              <button
                type="button"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 sm:w-1/3"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Retour
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailStep;

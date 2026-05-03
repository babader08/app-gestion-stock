import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResendOTP, useVerifyOTP } from "../hooks";
import toast from "react-hot-toast";

const ValideCode = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const { mutate: verifyOTP, isPending: isVerifying } = useVerifyOTP();
  const { mutate: resendOTP, isPending: isResending } = useResendOTP();

  const isLoading = isVerifying || isResending;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!code || code.length < 6) {
      setError("Veuillez saisir le code à 6 chiffres");
      return;
    }

    setError("");

    verifyOTP(
      { code },
      {
        onSuccess: (response) => {
          navigate("/", {
            state: { message: "Compte activé ! Connectez-vous." },
          });
          toast.success("Vous compte est activé !");
          console.log("Code validé:", response);
        },
        onError: (err) => {
          const message =
            err?.response?.data?.error || "Une erreur est survenue";
          setError(message);
          console.error("Erreur verification:", err);
        },
      },
    );
  };

  const handleResendCode = () => {
    if (!email) {
      setError("Email manquant");
      return;
    }

    setError("");

    resendOTP(
      { email },
      {
        onSuccess: (response) => {
          setCode("");
          setError("");
          console.log("Code renvoyé:", response);
        },
        onError: (err) => {
          const message =
            err?.response?.data?.error || "Erreur lors de l'envoi du code";
          setError(message);
          console.error("Erreur resend OTP:", err);
        },
      },
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setError("");
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">📦</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StorePro</h1>
          <p className="mt-2 text-gray-600">Vérifiez votre adresse email</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-sm text-gray-700">
              Nous avons envoyé un code de confirmation à :
            </p>
            <p className="mt-2 font-semibold text-blue-600">{email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="code"
                className="mb-3 block text-sm font-semibold text-gray-700"
              >
                Code de vérification
              </label>
              <input
                type="text"
                id="code"
                name="code"
                maxLength="6"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={isLoading}
                className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-4xl font-bold tracking-widest text-gray-900 placeholder-gray-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="000000"
              />
              <p className="mt-2 text-center text-xs text-gray-600">
                Entrez le code à 6 chiffres
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className={`w-full rounded-lg py-2.5 font-semibold text-white transition-all duration-200 ${
                isLoading || code.length < 6
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Vérification...
                </span>
              ) : (
                "Vérifier mon compte"
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-600">
                Vous n'avez pas reçu le code ?
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading}
            className="w-full rounded-lg border-2 border-gray-300 py-2.5 font-semibold text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-transparent"></span>
                Envoi en cours...
              </span>
            ) : (
              "Renvoyer le code"
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Le code expire dans 1 heure.{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Retourner à la connexion
          </a>
        </p>
      </div>
    </div>
  );
};

export default ValideCode;

import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRegister } from "../hooks";

const Register = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const { mutate: register, isPending } = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!userData.name || !userData.email || !userData.password) {
      setErrors({ general: "Tous les champs sont requis" });
      return;
    }

    setErrors({});

    register(userData, {
      onSuccess: (response) => {
        navigate("/validCode", { state: { email: userData.email } });
        console.log(response);
      },
      onError: (err) => {
        const errorData = err.data;
        setErrors(errorData);
        console.error(errorData);
      },
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setErrors({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [errors]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">📦</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StorePro</h1>
          <p className="mt-2 text-gray-600">Créez votre compte gratuitement</p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-lg md:p-8">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Nom complet
              </label>
              <input
                type="text"
                autoComplete="name"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                disabled={isPending}
                className={`mt-2 w-full rounded-lg border px-4 py-2.5 transition-all outline-none disabled:bg-gray-100 disabled:text-gray-500 ${
                  errors?.name
                    ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
                placeholder="Fallou Seck"
              />
              {errors?.name && (
                <p className="mt-1.5 text-xs text-red-600">{errors.name[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Adresse Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                disabled={isPending}
                className={`mt-2 w-full rounded-lg border px-4 py-2.5 transition-all outline-none disabled:bg-gray-100 disabled:text-gray-500 ${
                  errors?.email
                    ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
                placeholder="exemple@email.com"
              />
              {errors?.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Mot de passe
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={userData.password}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
                disabled={isPending}
                className={`mt-2 w-full rounded-lg border px-4 py-2.5 transition-all outline-none disabled:bg-gray-100 disabled:text-gray-500 ${
                  errors?.password
                    ? "border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-200"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
                placeholder="Minimum 8 caractères"
              />
              {errors?.password && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.password[0]}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={`w-full rounded-lg py-2.5 font-semibold text-white transition-all duration-200 ${
                isPending
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Inscription en cours...
                </span>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-600">
                Vous avez un compte ?
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full rounded-lg border-2 border-gray-300 py-2.5 font-semibold text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;

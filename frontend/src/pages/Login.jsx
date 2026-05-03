import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useLogin } from "../hooks";

const Login = () => {
  const [dataUser, setDataUser] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useContext(AuthContext);

  const { mutate: login, isPending } = useLogin();

  const handleClick = (e) => {
    e.preventDefault();

    if (!dataUser.email || !dataUser.password) {
      setError("Email et mot de passe sont requis");
      return;
    }

    setError("");

    login(dataUser, {
      onSuccess: () => {
        setIsAuthenticated(true);
        setUser({ email: dataUser.email });
        navigate("/dashboard");
      },
      onError: (err) => {
        const message = err?.error;
        setError(message);
        console.error("Erreur login:", err);
      },
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-5 text-center md:mb-8">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-lg font-bold text-white">📦</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StorePro</h1>
          <p className="mt-2 text-gray-600">Connectez-vous à votre compte</p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-lg md:p-8">
          <form onSubmit={handleClick} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Adresse Email
              </label>
              <input
                autoComplete="email"
                disabled={isPending}
                value={dataUser.email}
                onChange={(e) =>
                  setDataUser({ ...dataUser, email: e.target.value })
                }
                type="email"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="exemple@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Mot de passe
                </label>
                <Link
                  to="/password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Oublié ?
                </Link>
              </div>
              <input
                autoComplete="current-password"
                disabled={isPending}
                value={dataUser.password}
                onChange={(e) =>
                  setDataUser({ ...dataUser, password: e.target.value })
                }
                type="password"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={`mt-2 w-full rounded-lg py-2.5 font-semibold text-white transition-all duration-200 ${
                isPending
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-600">
                Nouveau sur StorePro ?
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full rounded-lg border-2 border-gray-300 py-2.5 font-semibold text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50"
          >
            Créer un compte
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

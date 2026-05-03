import { LogOut } from "lucide-react";
import { useContext, useState } from "react";
import { useLogout } from "../hooks";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const UserForm = () => {
  const [title, setTitle] = useState("");
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: (response) => {
        setIsAuthenticated(false);
        setUser(null);
        navigate("/login");
        console.log(response);
      },
      onError: (err) => {
        const message = err?.response?.data?.error || "Une erreur est survenue";
        console.error(message);
      },
    });
  };

  return (
    <form className="mb-10 rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="mb-4 text-lg font-bold text-blue-400">
          Ajouter un membre
        </h2>
        <h2
          onClick={handleLogout}
          className="mb-4 cursor-pointer text-lg font-bold text-blue-400"
        >
          {isPending ? "Déconnexion...." : "Déconnexion"}
        </h2>
      </div>
      <div className="flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="title"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 p-3 text-white transition-colors focus:border-blue-500 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-colors hover:bg-blue-500 active:scale-95"
        >
          Ajouter
        </button>
      </div>
    </form>
  );
};

export default UserForm;

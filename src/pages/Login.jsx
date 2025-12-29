import { useState } from "react";
import Swal from "sweetalert2";
import { api } from "../api";
import { setSession } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const username = form.username.trim();
    const password = form.password;

    if (!username || !password) {
      return Swal.fire("Faltan datos", "Ingresa usuario y contraseña", "warning");
    }

    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { username, password });

      if (!data?.token) throw new Error("Respuesta de login inválida");

      setSession({
        token: data.token,
        user: {
          username,
          roles: data.roles || [],
        },
      });
      await Swal.fire("", "Sesión iniciada", "success");
      nav("/pos");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || err.message || "Login falló", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-60 p-4">
      <div className="w-full max-w-md bg-white border rounded-2xl p-6">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-gray-600 mt-1">Accede para usar el POS</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm font-medium">Usuario</label>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              className="mt-1 w-full px-3 py-2 border rounded-xl"
              placeholder="usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              className="mt-1 w-full px-3 py-2 border rounded-xl"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

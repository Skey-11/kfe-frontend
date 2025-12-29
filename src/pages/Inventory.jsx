import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../api";
import { getUser } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Inventory() {
  const user = getUser();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  
  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/products");
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || "No se pudieron cargar productos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((p) => (p.name || "").toLowerCase().includes(s));
  }, [items, q]);

  const openEdit = async (p) => {
    const track = Number(p.track_stock) === 1;

    const { value, isConfirmed } = await Swal.fire({
      title: `Editar: ${p.name}`,
      html: `
        <div style="text-align:left;display:grid;gap:10px">
          <label>Nombre</label>
          <input id="sw_name" class="swal2-input" value="${escapeHtml(p.name)}" />

          <label>Precio</label>
          <input id="sw_price" class="swal2-input" type="number" step="0.01" value="${Number(p.price)}" />

          <label style="display:flex;gap:8px;align-items:center;margin-top:6px">
            <input id="sw_track" type="checkbox" ${track ? "checked" : ""} />
            <span>Maneja inventario (track_stock)</span>
          </label>

          <div id="sw_stock_wrap" style="display:${track ? "block" : "none"}">
            <label>Stock</label>
            <input id="sw_stock" class="swal2-input" type="number" step="1" value="${Number(p.stock ?? 0)}" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      didOpen: () => {
        const chk = document.getElementById("sw_track");
        const wrap = document.getElementById("sw_stock_wrap");
        chk.addEventListener("change", () => {
          wrap.style.display = chk.checked ? "block" : "none";
        });
      },
      preConfirm: () => {
        const name = document.getElementById("sw_name").value;
        const price = document.getElementById("sw_price").value;
        const track_stock = document.getElementById("sw_track").checked ? 1 : 0;
        const stockEl = document.getElementById("sw_stock");
        const stock = stockEl ? stockEl.value : undefined;

        return { name, price, track_stock, stock };
      },
    });

    if (!isConfirmed) return;

    try {
      const dto = {};
      if (value.name !== undefined) dto.name = value.name;
      if (value.price !== undefined) dto.price = value.price;
      dto.track_stock = value.track_stock ? 1 : 0;

      if (dto.track_stock === 1) dto.stock = value.stock;
      else dto.stock = undefined;

      await api.put(`/products/${p.id}`, dto);

      await Swal.fire("Listo", "Producto actualizado", "success");
      load();
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || "No se pudo actualizar", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <div className="text-xl font-semibold">Inventario</div>
            <div className="text-sm text-gray-600">
              {user?.username || ""} {user?.roles?.length ? `(${user.roles.join(", ")})` : ""}
            </div>
          </div>

          <div className="sm:ml-auto flex gap-2 w-full sm:w-auto">
            <input
              className="w-full sm:w-80 px-3 py-2 border rounded-xl"
              placeholder="Buscar..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              onClick={load}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100"
              disabled={loading}
            >
              {loading ? "..." : "Recargar"}
            </button>
                <button
      onClick={() => nav("/pos")}
      className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100"
    >
      Punto de venta
    </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-semibold">Productos ({filtered.length})</div>
            <div className="text-sm text-gray-600">Solo manager/admin</div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-3 border-b">ID</th>
                  <th className="p-3 border-b">Nombre</th>
                  <th className="p-3 border-b">Precio</th>
                  <th className="p-3 border-b">Track</th>
                  <th className="p-3 border-b">Stock</th>
                  <th className="p-3 border-b"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const track = Number(p.track_stock) === 1;
                  const out = track && Number(p.stock) <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-3 border-b">{p.id}</td>
                      <td className="p-3 border-b">{p.name}</td>
                      <td className="p-3 border-b">${Number(p.price).toFixed(2)}</td>
                      <td className="p-3 border-b">{track ? "Sí" : "No"}</td>
                      <td className={`p-3 border-b ${out ? "text-red-600 font-medium" : ""}`}>
                        {track ? p.stock : "—"}
                      </td>
                      <td className="p-3 border-b text-right">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-2 rounded-xl border hover:bg-gray-100"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td className="p-4 text-gray-600" colSpan={6}>
                      Sin resultados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

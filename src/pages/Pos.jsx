import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../api";
import { clearSession, getUser } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Pos() {
  const nav = useNavigate();
  const user = getUser();

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [charging, setCharging] = useState(false);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data } = await api.get("/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || "No se pudieron cargar productos", "error");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) => (p.name || "").toLowerCase().includes(s));
  }, [products, q]);

  const addToCart = (p) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const incQty = (id) => {
    setCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)));
  };

  const decQty = (id) => {
    setCart((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
  };

  const clearCart = () => setCart([]);

  const total = useMemo(() => {
    const t = cart.reduce((acc, it) => acc + Number(it.price) * Number(it.qty), 0);
    return Number(t.toFixed(2));
  }, [cart]);

  const validateCart = () => {
    if (!cart.length) return "Carrito vacío";

    for (const it of cart) {
      const track = Number(it.track_stock) === 1;
      if (track && Number(it.stock) < Number(it.qty)) {
        return `Stock insuficiente para: ${it.name} (stock: ${it.stock}, solicitado: ${it.qty})`;
      }
    }
    return null;
  };

  const logout = async () => {
    clearSession();
    await Swal.fire("Listo", "Sesión cerrada", "success");
    nav("/login");
  };

  const checkout = async () => {
    const msg = validateCart();
    if (msg) return Swal.fire("No se puede vender", msg, "warning");

    const confirm = await Swal.fire({
      title: "Confirmar venta",
      html: `<div>Total: <b>$${total.toFixed(2)}</b></div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Cobrar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      setCharging(true);
      const payload = { items: cart.map((x) => ({ product_id: x.id, qty: x.qty })) };
      const { data } = await api.post("/sales", payload);

      await Swal.fire(
        "Venta registrada",
        `Folio: #${data.sale_id} — Total: $${Number(data.total).toFixed(2)}`,
        "success"
      );

      clearCart();
      await loadProducts();
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || "No se pudo registrar la venta", "error");
    } finally {
      setCharging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <div className="text-xl font-semibold">Punto de Venta</div>
            <div className="text-sm text-gray-600">
              {user?.username || ""} {user?.roles?.length ? `(${user.roles.join(", ")})` : ""}
            </div>
          </div>

          <div className="sm:ml-auto flex gap-2 w-full sm:w-auto">
            <input
              className="w-full sm:w-80 px-3 py-2 border rounded-xl"
              placeholder="Buscar producto..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
              {user?.roles?.some((r) => ["manager", "admin"].includes(r)) && (
    <button
      onClick={() => nav("/inventory")}
      className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100"
    >
      Inventario
    </button>
  )}
            <button
              onClick={loadProducts}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100"
              disabled={loadingProducts}
            >
              {loadingProducts ? "..." : "Recargar"}
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Productos</h2>
            <div className="text-sm text-gray-600">{filtered.length} items</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((p) => {
              const track = Number(p.track_stock) === 1;
              const out = track && Number(p.stock) <= 0;

              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={out}
                  className="text-left border rounded-2xl p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-gray-600">
                        {track ? `Stock: ${p.stock}` : "No controla stock"}
                      </div>
                    </div>
                    <div className="font-semibold">${Number(p.price).toFixed(2)}</div>
                  </div>
                  {out && <div className="mt-2 text-sm text-red-600">Sin stock</div>}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="bg-white border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Carrito</h2>
            <button
              onClick={clearCart}
              className="text-sm px-3 py-1.5 rounded-xl border hover:bg-gray-50"
              disabled={!cart.length}
            >
              Vaciar
            </button>
          </div>

          {!cart.length ? (
            <div className="text-gray-600">Agrega productos para comenzar</div>
          ) : (
            <div className="space-y-3">
              {cart.map((it) => {
                const track = Number(it.track_stock) === 1;
                const warn = track && Number(it.stock) < Number(it.qty);

                return (
                  <div key={it.id} className="border rounded-2xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-sm text-gray-600">${Number(it.price).toFixed(2)} c/u</div>
                        <div className={`text-xs mt-1 ${warn ? "text-red-600" : "text-gray-500"}`}>
                          {track ? `Stock: ${it.stock}` : "No controla stock"}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(it.id)}
                        className="px-2 py-1 rounded-lg border hover:bg-gray-50 text-sm"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => decQty(it.id)}
                        className="w-9 h-9 rounded-xl border hover:bg-gray-50"
                      >
                        -
                      </button>
                      <div className="w-10 text-center font-semibold">{it.qty}</div>
                      <button
                        onClick={() => incQty(it.id)}
                        className="w-9 h-9 rounded-xl border hover:bg-gray-50"
                      >
                        +
                      </button>

                      <div className="ml-auto font-semibold">
                        ${(Number(it.price) * Number(it.qty)).toFixed(2)}
                      </div>
                    </div>

                    {warn && (
                      <div className="mt-2 text-sm text-red-600">
                        Stock insuficiente para esta cantidad
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 border-t pt-4 flex items-center justify-between">
            <div className="font-semibold">Total</div>
            <div className="text-2xl font-bold">${total.toFixed(2)}</div>
          </div>

          <button
            onClick={checkout}
            disabled={charging || !cart.length}
            className="mt-3 w-full py-3 rounded-2xl bg-black text-white hover:opacity-90 disabled:opacity-60"
          >
            {charging ? "Procesando..." : "Cobrar"}
          </button>
        </aside>
      </main>
    </div>
  );
}

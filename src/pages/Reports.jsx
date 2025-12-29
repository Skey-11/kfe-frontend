import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Reports() {
  const nav = useNavigate();

  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [loading, setLoading] = useState(false);

  const [sold, setSold] = useState([]);
  const [top, setTop] = useState([]);
  const [chart, setChart] = useState([]);

  const totalAmount = useMemo(() => {
    const sum = sold.reduce((acc, x) => acc + Number(x.total_amount || 0), 0);
    return Number(sum.toFixed(2));
  }, [sold]);

  const run = async () => {
    if (!from || !to) return Swal.fire("Error", "Selecciona from y to", "warning");
    if (from > to) return Swal.fire("Error", "from no puede ser mayor que to", "warning");

    try {
      setLoading(true);

      const [r1, r2, r3] = await Promise.all([
        api.get("/reports/sold-products", { params: { from, to } }),
        api.get("/reports/top-products", { params: { from, to, limit: 3 } }),
        api.get("/reports/sales-by-product", { params: { from, to } }),
      ]);

      setSold(Array.isArray(r1.data) ? r1.data : []);
      setTop(Array.isArray(r2.data) ? r2.data : []);
      setChart(
        (Array.isArray(r3.data) ? r3.data : []).map((x) => ({
          label: x.label,
          value: Number(x.value || 0),
        }))
      );
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.message || "No se pudieron cargar reportes", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <div className="text-xl font-semibold">Módulo Gerencial</div>
            <div className="text-sm text-gray-600">Reportes de ventas</div>
          </div>

          <div className="sm:ml-auto flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Desde</label>
              <input
                type="date"
                className="px-3 py-2 border rounded-xl"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Hasta</label>
              <input
                type="date"
                className="px-3 py-2 border rounded-xl"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <button
              onClick={run}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Consultando..." : "Consultar"}
            </button>

            <button
              onClick={() => nav("/inventory")}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100"
            >
              Inventario
            </button>

            <button
              onClick={() => nav("/pos")}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-100"
            >
              POS
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="font-semibold">2.1 Productos vendidos</div>
            <div className="text-sm text-gray-600">
              Total vendido: <b>${totalAmount.toFixed(2)}</b>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-3 border-b">ID</th>
                  <th className="p-3 border-b">Producto</th>
                  <th className="p-3 border-b">Cantidad</th>
                  <th className="p-3 border-b">Total</th>
                </tr>
              </thead>
              <tbody>
                {sold.map((x) => (
                  <tr key={x.id} className="hover:bg-gray-50">
                    <td className="p-3 border-b">{x.id}</td>
                    <td className="p-3 border-b">{x.name}</td>
                    <td className="p-3 border-b">{Number(x.total_qty)}</td>
                    <td className="p-3 border-b">${Number(x.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
                {!sold.length && (
                  <tr>
                    <td className="p-4 text-gray-600" colSpan={4}>
                      Sin datos. Selecciona un rango y presiona “Consultar”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="bg-white border rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-semibold">2.2 Top 3 productos más vendidos</div>
            <div className="text-sm text-gray-600">Por cantidad</div>
          </div>

          <div className="p-4 space-y-2">
            {top.map((x, idx) => (
              <div key={x.id} className="border rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    #{idx + 1} {x.name}
                  </div>
                  <div className="font-semibold">{Number(x.total_qty)}</div>
                </div>
                <div className="text-xs text-gray-600">ID: {x.id}</div>
              </div>
            ))}
            {!top.length && <div className="text-gray-600">Sin datos.</div>}
          </div>
        </aside>

        <section className="lg:col-span-3 bg-white border rounded-2xl overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-semibold">2.3 Gráfica de ventas por producto</div>
            <div className="text-sm text-gray-600">Monto vendido por producto</div>
          </div>

          <div className="p-4" style={{ height: 360 }}>
            {!chart.length ? (
              <div className="text-gray-600">Sin datos para graficar.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

import { useState } from 'react'
import './App.css'
import Swal from "sweetalert2";

function App() {
  const [count, setCount] = useState(0)

  return (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <h1 className="text-4xl font-bold text-white">
      Tailwind funciona 🚀
    </h1>
    <button
  onClick={() => Swal.fire("Todo listo", "SweetAlert2 funciona", "success")}
  className="px-4 py-2 bg-blue-600 text-white rounded"
>
  Probar alerta
</button>
  </div>
  
  )
}

export default App

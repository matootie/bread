import { createRoot } from "react-dom/client"

import "./styles.css"

const root = document.getElementById("root")!
createRoot(root).render(
  <div>
    <h1 className="text-2xl">Hello, world!</h1>
  </div>
)

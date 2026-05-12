import { Link } from "react-router-dom"

const NotFoundPage = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "4rem", fontWeight: 700, color: "#7c3aed", marginBottom: "0.5rem" }}>404</h1>
      <p style={{ fontSize: "1.125rem", color: "#52525b", marginBottom: "2rem" }}>
        La página que buscas no existe.
      </p>
      <Link
        to="/dashboard"
        style={{
          padding: "0.625rem 1.5rem",
          background: "#7c3aed",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: 500,
        }}
      >
        Volver al Dashboard
      </Link>
    </div>
  )
}

export default NotFoundPage

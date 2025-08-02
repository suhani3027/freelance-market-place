import { useState } from "react";

export default function Messages() {
  const [search, setSearch] = useState("");

  return (
    <div style={{ display: "flex", height: "90vh" }}>
      {/* Sidebar */}
      <div style={{
        width: 350,
        borderRight: "1px solid #eee",
        padding: 24,
        background: "#fafafa"
      }}>
        <h2 style={{ fontWeight: 600 }}>Messages</h2>
        <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: 4
            }}
          />
          <span style={{ marginLeft: 8, cursor: "pointer" }}>⚙️</span>
        </div>
        <div style={{ color: "#888", marginTop: 32 }}>
          Conversations will appear here
        </div>
      </div>
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 48,
            color: "#ccc",
            marginBottom: 16
          }}>💬</div>
          <h2 style={{ fontWeight: 500, color: "#555" }}>Welcome to Messages</h2>
          <p style={{ color: "#888", marginBottom: 24 }}>
            Once you connect with a freelancer, you’ll be able to chat and collaborate here
          </p>
          <button style={{
            background: "#14a800",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "12px 32px",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer"
          }}>
            Search for talent
          </button>
        </div>
      </div>
    </div>
  );
}
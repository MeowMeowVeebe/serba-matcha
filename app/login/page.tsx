"use client";

import { useState } from "react";
import { useAlert } from "../../context/AlertContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showAlert } = useAlert();

  const handleLogin = () => {
    if (!email || !password) {
      showAlert("Email dan password harus diisi!");
      return;
    }
    // logika login server
    showAlert("Login berhasil!");
  };

  return (
    <div className="auth-page">
      <h2>Login</h2>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

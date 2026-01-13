"use client";

import { useState } from "react";
import { useAlert } from "../../context/AlertContext";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showAlert } = useAlert();

  const handleRegister = () => {
    if (!email || !password) {
      showAlert("Email dan password harus diisi!");
      return;
    }
    // logika register server
    showAlert("Registrasi berhasil!");
  };

  return (
    <div className="auth-page">
      <h2>Register</h2>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button onClick={handleRegister}>Daftar</button>
    </div>
  );
}

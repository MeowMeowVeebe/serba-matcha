"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAlert } from "../../context/AlertContext";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [name, setName] = useState("Ray Alland");
  const [email] = useState("john@example.com");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const { showAlert } = useAlert();

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const handleSave = () => {
    if (!oldPassword) {
      showAlert("Masukkan password lama terlebih dahulu!");
      return;
    }
    // logika update password/name di server bisa ditambahkan di sini
    showAlert("Pengaturan berhasil disimpan!");
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <>
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>Serba Matchia</h2>
        <Link href="/dashboard">Dashboard</Link>
      </div>

      <div className="main">
        {/* HEADER DIHAPUS */}

        <div className="settings-grid">
          {/* PROFILE */}
          <div className="card">
            <div className="card-header">
              <h3>Your Profile</h3>
            </div>

            <div className="form-group">
              <label>Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} disabled />
            </div>
          </div>

          {/* SECURITY */}
          <div className="card">
            <div className="card-header">
              <h3>Keamanan</h3>
              <p>Ubah password akun</p>
            </div>

            <div className="form-group">
              <label>Password Lama</label>
              <input
                type="password"
                placeholder="********"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password Baru</label>
              <input
                type="password"
                placeholder="********"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="action-bar">
          <button className="primary-btn" onClick={handleSave}>
            Simpan Perubahan
          </button>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";

export default function ProfileForm({ onNext }: any) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Data Profil</h2>

      <input
        className="w-full border p-2 rounded mb-3"
        placeholder="Nama anak"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select
        className="w-full border p-2 rounded mb-3"
        value={age}
        onChange={(e) => setAge(e.target.value)}
      >
        <option value="">Pilih umur</option>
        <option value="2">2 tahun</option>
        <option value="3">3 tahun</option>
        <option value="4">4 tahun</option>
      </select>

      <select
        className="w-full border p-2 rounded mb-3"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
      >
        <option value="">Pilih gender</option>
        <option value="laki-laki">Laki-laki</option>
        <option value="perempuan">Perempuan</option>
      </select>

      <button
        className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-300"
        disabled={!name || !age || !gender}
        onClick={() =>
          onNext({
            name,
            age: Number(age),
            gender,
          })
        }
      >
        Lanjut
      </button>
    </div>
  );
}
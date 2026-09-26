import React from "react";
import { Link } from "react-router-dom";

export default function DocumentQuiz() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#11131c] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/create-quiz" className="text-sm text-pink-300">← Create Quiz</Link>
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#191b26] p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-3xl">📄</div>
          <h1 className="mt-5 text-3xl font-extrabold">PDF / PPT Quiz</h1>
          <p className="mt-3 text-gray-400">Document upload and AI extraction is the next integration. The Create Quiz hub is already prepared for this method.</p>
          <Link to="/create-quiz" className="mt-7 inline-block rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 font-bold">Back to Creation Methods</Link>
        </div>
      </div>
    </main>
  );
}

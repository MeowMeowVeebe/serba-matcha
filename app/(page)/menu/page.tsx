export default function menu_page() {
  const categories = [
    "Matcha Series",
    "Coffee Series",
    "Dessert",
    "Signature",
    "Seasonal",
    "Promo",
    "Merch",
    "Take Away",
    "Food"
  ];

  const active = "Matcha Series"; // change this later to use state

  return (
    <main className="min-h-screen bg-green-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-green-900 mb-8 text-center">Menu</h1>

        {/* 3 selections layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const isActive = cat === active;

            return (
              <button
                key={cat}
                className={[
                  "w-full rounded-full border-2 px-6 py-3 font-semibold transition",
                  "border-green-700 text-green-800 hover:bg-green-700 hover:text-white",
                  isActive ? "bg-green-700 text-white" : "bg-transparent"
                ].join(" ")}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );



}


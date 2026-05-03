import React from "react";
import AddProductForm from "../components/AddProductForm";
import AllProducts from "../components/AllProducts";

const Products = () => {
  return (
    <div>
      <h1 className="mb-4 pl-5 text-2xl font-bold text-gray-900">
        Gestion des Produits
      </h1>
      <AddProductForm />
      <AllProducts />
    </div>
  );
};

export default Products;

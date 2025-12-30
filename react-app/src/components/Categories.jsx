import "./Categories.css";
import categories from "./CategoriesList";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaThLarge,
  FaBook,
  FaCouch,
  FaFootballBall,
  FaLaptop,
  FaKeyboard,
  FaVolumeUp,
  FaDesktop,
  FaSnowflake,
  FaBicycle,
  FaCalculator,
  FaFire,
  FaEllipsisH,
} from "react-icons/fa";

// Map categories to icons - matching actual CategoriesList
const categoryIcons = {
  "Sports Equipment": FaFootballBall,
  "Computer Accessories": FaKeyboard,
  "Air Cooler": FaSnowflake,
  Laptop: FaLaptop,
  Speaker: FaVolumeUp,
  Monitor: FaDesktop,
  Furniture: FaCouch,
  Books: FaBook,
  Bicycle: FaBicycle,
  Calculator: FaCalculator,
  "Room Heater": FaFire,
  Other: FaEllipsisH,
};

function Categories({ handleCategory, selectedCategories = [] }) {
  const navigate = useNavigate();
  const params = useParams();
  const currentCategory = params.categoryName;

  // Check if we're on a category page or using filter mode
  const isFilterMode = typeof handleCategory === "function";

  const getCategoryIcon = (category) => {
    const Icon = categoryIcons[category] || FaThLarge;
    return <Icon />;
  };

  const handleCategoryClick = (category) => {
    if (isFilterMode) {
      handleCategory(category);
    } else {
      navigate(`/category/${category}`);
    }
  };

  const isSelected = (category) => {
    if (isFilterMode) {
      return selectedCategories.includes(category);
    }
    return currentCategory === category;
  };

  return (
    <div className="categories-bar">
      <div className="categories-container">
        {!isFilterMode && (
          <button
            className={`category-chip ${!currentCategory ? "active" : ""}`}
            onClick={() => navigate("/")}
          >
            <FaThLarge />
            All
          </button>
        )}

        {categories.map((item, index) => (
          <button
            key={index}
            className={`category-chip ${isSelected(item) ? "active" : ""}`}
            onClick={() => handleCategoryClick(item)}
          >
            {getCategoryIcon(item)}
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Categories;

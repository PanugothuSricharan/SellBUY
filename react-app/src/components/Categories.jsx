import React, { useRef, useState, useEffect } from "react";
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
  FaChevronLeft,
  FaChevronRight,
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
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check if we're on a category page or using filter mode
  const isFilterMode = typeof handleCategory === "function";

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  const scrollCategories = (direction) => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
      {/* Left scroll arrow - desktop only */}
      {showLeftArrow && (
        <button 
          className="category-scroll-btn scroll-left" 
          onClick={() => scrollCategories('left')}
          aria-label="Scroll left"
        >
          <FaChevronLeft />
        </button>
      )}

      <div 
        className="categories-container" 
        ref={containerRef}
        onScroll={checkScrollPosition}
      >
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

      {/* Right scroll arrow - desktop only */}
      {showRightArrow && (
        <button 
          className="category-scroll-btn scroll-right" 
          onClick={() => scrollCategories('right')}
          aria-label="Scroll right"
        >
          <FaChevronRight />
        </button>
      )}
    </div>
  );
}

export default Categories;

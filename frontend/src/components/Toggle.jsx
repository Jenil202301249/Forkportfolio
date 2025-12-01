import React from "react";
import "./Toggle.css";

const Toggle = ({ value, onChange }) => {
  return (
    <label className="toggle-switch">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange && onChange(e.target.checked)} // Added safety check
      />
      <span className="slider"></span>
    </label>
  );
};

export default Toggle;
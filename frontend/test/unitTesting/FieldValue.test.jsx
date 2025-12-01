import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { FieldValue } from "../../src/components/FieldValue.jsx";

describe("FieldValue Component", () => {
  
  it("renders fieldname and value correctly", () => {
    render(<FieldValue fieldname="PE Ratio" value="25.3" />);

    expect(screen.getByText("PE Ratio")).toBeInTheDocument();
    expect(screen.getByText("25.3")).toBeInTheDocument();
  });

  it("applies custom classname when provided", () => {
    render(<FieldValue classname="extra-class" fieldname="Volume" value="10M" />);

    const wrapper = screen.getByText("Volume").parentElement;

    expect(wrapper).toHaveClass("field-value");
    expect(wrapper).toHaveClass("extra-class");
  });

  it("does not add 'undefined' classname when no classname is provided", () => {
    render(<FieldValue fieldname="Open" value="150" />);

    const wrapper = screen.getByText("Open").parentElement;

    expect(wrapper).toHaveClass("field-value");
    expect(wrapper).not.toHaveClass("undefined");
    expect(wrapper).not.toHaveClass("null");
  });

  it("renders with empty value", () => {
    render(<FieldValue fieldname="EPS" value="" />);

    expect(screen.getByText("EPS")).toBeInTheDocument();
    const valueSpan = screen.getByText("", { selector: ".fvalue" });
    expect(valueSpan).toBeInTheDocument();
  });
});

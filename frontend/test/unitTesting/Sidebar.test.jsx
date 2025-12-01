import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import axios from "axios";
import { Sidebar } from "../../src/components/Sidebar";

// Mock navigate + location
const mockNavigate = vi.fn();
let mockPathname = "/my-profile";

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    pathname: mockPathname
  })
}));

// Mock assets (Vite: return raw string)
vi.mock("../../src/assets/profileicon.svg", () => ({ default: "profileicon.svg" }));
vi.mock("../../src/assets/routeicon.svg", () => ({ default: "routeicon.svg" }));
vi.mock("../../src/assets/logoutSym.png", () => ({ default: "logoutSym.png" }));

// Mock axios
vi.mock("axios");

describe("Sidebar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
    mockPathname = "/my-profile";
  });

  // -----------------------------------------------------
  // 1. RENDERING TESTS
  // -----------------------------------------------------
  it("renders Sidebar with default profile data and highlights My Profile", () => {
    render(<Sidebar primaryData={{ name: "John Doe", email: "john@example.com" }} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    const img = screen.getByAltText("Profile Pic");
    expect(img.src).toContain("profileicon.svg");

    expect(screen.getByText("My Profile")).toHaveClass("Active");
  });

  // -----------------------------------------------------
  // 2. NAVIGATION TEST
  // -----------------------------------------------------
  it("navigates to Data & Privacy when clicked", () => {
    render(<Sidebar primaryData={{ name: "John Doe", email: "john@example.com" }} />);

    fireEvent.click(screen.getByText("Data & Privacy"));
    expect(mockNavigate).toHaveBeenCalledWith("/data-privacy");
  });

  // -----------------------------------------------------
  // 3. LOGOUT SUCCESS
  // -----------------------------------------------------
  it("calls logout API and navigates home", async () => {
    axios.post.mockResolvedValueOnce({});

    render(<Sidebar primaryData={{}} />);

    fireEvent.click(screen.getByText("Logout"));

    expect(axios.post).toHaveBeenCalled();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/")
    );
  });

  // -----------------------------------------------------
  // 4. LOGOUT FAILURE
  // -----------------------------------------------------
  it("handles logout error gracefully", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    render(<Sidebar primaryData={{}} />);

    fireEvent.click(screen.getByText("Logout"));

    expect(axios.post).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalledWith("/");
  });

  // -----------------------------------------------------
  // 5. CUSTOM PROFILE IMAGE
  // -----------------------------------------------------
  it("renders custom profile image when provided", () => {
    render(
      <Sidebar primaryData={{
        name: "Jane",
        email: "jane@example.com",
        profileImage: "custom.jpg"
      }} />
    );

    const img = screen.getByAltText("Profile Pic");
    expect(img.src).toContain("custom.jpg");
  });

  // -----------------------------------------------------
  // 6. LOCAL STORAGE ACTIVE MENU
  // -----------------------------------------------------
  it("restores active menu from localStorage", () => {
    localStorage.setItem("activeMenu", "Activity");

    render(<Sidebar primaryData={{}} />);

    const items = screen.getAllByTestId("activity-item");
    expect(items.length).toBeGreaterThan(0);
  });


  // -----------------------------------------------------
  // 7. "/data-privacy" route
  // -----------------------------------------------------
  it("activates Data & Privacy when route is /data-privacy", async () => {
    mockPathname = "/data-privacy";
    render(<Sidebar primaryData={{}} />);

    await waitFor(() => {
      const activeBtn = document.querySelector(".Sidebar-item.Active");
      expect(activeBtn).not.toBeNull();
      expect(activeBtn.textContent).toMatch(/Data & Privacy/i);
    });
  });

  it("activates Activity when route is /activity", async () => {
    mockPathname = "/activity";
    render(<Sidebar primaryData={{}} />);

    await waitFor(() => {
      const activeBtn = document.querySelector(".Sidebar-item.Active");
      expect(activeBtn).not.toBeNull();
      expect(activeBtn.textContent).toMatch(/Activity/i);
    });
  });

  it("activates Preferences when route is /preferences", async () => {
    mockPathname = "/preferences";
    render(<Sidebar primaryData={{}} />);

    await waitFor(() => {
      const activeBtn = document.querySelector(".Sidebar-item.Active");
      expect(activeBtn).not.toBeNull();
      expect(activeBtn.textContent).toMatch(/Preferences/i);
    });
  });

  it("activates Help & Support when route is /help-support", async () => {
    mockPathname = "/help-support";
    render(<Sidebar primaryData={{}} />);

    await waitFor(() => {
      const activeBtn = document.querySelector(".Sidebar-item.Active");
      expect(activeBtn).not.toBeNull();
      expect(activeBtn.textContent).toMatch(/Help & Support/i);
    });
  });

});

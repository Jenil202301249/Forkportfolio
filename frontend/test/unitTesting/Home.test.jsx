import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, vi } from "vitest";
import {Home} from "../../src/pages/Home.jsx";
import axios from "axios";

vi.mock("../../src/assets/home-page-bg.jpg", () => ({ default: "home-bg.jpg" }));
vi.mock("../../src/assets/desh_board.png", () => ({ default: "dashboard.png" }));

vi.mock("../../src/assets/upArrow.png", () => ({ default: "upArrow.png" }));
vi.mock("../../src/assets/downArrow.png", () => ({ default: "downArrow.png" }));

vi.mock("../../src/assets/Optimize_Act.png", () => ({ default: "optimize.png" }));
vi.mock("../../src/assets/trackPerformance.png", () => ({ default: "track.png" }));
vi.mock("../../src/assets/addPortfolio.png", () => ({ default: "addPortfolio.png" }));
vi.mock("../../src/assets/creatAcc.png", () => ({ default: "creatAcc.png" }));

vi.mock("../../src/assets/featuredivlogo1.png", () => ({ default: "f1.png" }));
vi.mock("../../src/assets/featuredivlogo2.png", () => ({ default: "f2.png" }));
vi.mock("../../src/assets/featuredivlogo3.png", () => ({ default: "f3.png" }));
vi.mock("../../src/assets/featuredivlogo4.png", () => ({ default: "f4.png" }));


// --------------- Mock axios ---------------
vi.mock("axios");

// --------------- Mock react-router-dom ---------------
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  __esModule: true,
  Link: ({ children, to, onClick }) => (
    <div data-to={to} onClick={onClick}>
      {children}
    </div>
  ),
  useNavigate: () => mockNavigate,
}));

// --------------- Mock Context ---------------
vi.mock("../../src/context/AppContext.jsx", () => ({
  __esModule: true,
  useAppContext: () => ({
    darkMode: false,
    setDarkMode: vi.fn(),
  }),
}));

// --------------- Mock Navbar ---------------
vi.mock("../../src/components/Navbar.jsx", () => ({
  __esModule: true,
  default: () => <div data-testid="navbar">Mock Navbar</div>,
}));

// --------------- Mock Footer ---------------
vi.mock("../../src/components/Footer.jsx", () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Mock Footer</div>,
}));

// --------------- Mock CSS (VERY important for Home.css + AOS cases) ---------------
vi.mock("../../src/pages/Home.css", () => ({}));

// --------------- Clean up before each test ---------------
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});
describe("Home Component", () => {
test("renders Home with Navbar and Footer", () => {
  render(<Home />);

  expect(screen.getByTestId("navbar")).toBeInTheDocument();
  expect(screen.getByTestId("footer")).toBeInTheDocument();
});
test("redirects to dashboard when token is valid", async () => {
  axios.get.mockResolvedValue({
    data: { success: true }
  });

  render(<Home />);

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });
});
test("does not redirect when token is invalid", async () => {
  axios.get.mockRejectedValue(new Error("Invalid token"));

  render(<Home />);

  await waitFor(() => {
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

test("Get Started button sets sessionStorage correctly", () => {
  render(<Home />);

  const getStarted = screen.getByText("Get Started").closest("div");
  fireEvent.click(getStarted);

  expect(sessionStorage.getItem("isLogin")).toBe("true");
  expect(sessionStorage.getItem("forgotpassword")).toBe("false");
});
test("Sign Up Now button sets sessionStorage as expected", () => {
  render(<Home />);

  const signUp = screen.getByText("Sign Up Now").closest("div");
  fireEvent.click(signUp);

  expect(sessionStorage.getItem("isLogin")).toBe("false");
  expect(sessionStorage.getItem("forgotpassword")).toBe("false");
});
test("all FAQ items toggle open and closed", () => {
  const { container } = render(<Home />);

  // Get all FAQ arrows — there are 5 FAQ questions
  const arrows = screen.getAllByAltText(/arrow logo/i);

  // Ensure we found 5
  expect(arrows.length).toBe(5);

  // For each FAQ item
  arrows.forEach((arrow, index) => {
    // Select the corresponding answer (each .answer_text in order)
    const answers = container.querySelectorAll(".answer_text");
    const answer = answers[index];

    // Ensure initial state is hidden
    expect(answer).toHaveStyle({ display: "none" });

    // Click arrow → expands
    fireEvent.click(arrow);
    expect(answer).toHaveStyle({ display: "block" });

    // Click again → collapses
    fireEvent.click(arrow);
    expect(answer).toHaveStyle({ display: "none" });
  });
});


test("all feature cards expand individually when clicked", () => {
  const { container } = render(<Home />);

  // List of card titles (in order)
  const cardTitles = [
    "Dynamic Portfolio Tools",
    "Unified Dashboard",
    "Smart Watchlist",
    "Intelligent Insights",
  ];

  // Loop through each card
  cardTitles.forEach((title, index) => {
    // Get card by title
    const titleElement = screen.getByText(title);
    const cardDiv = titleElement.closest(".features_card");

    // Click the card
    fireEvent.click(cardDiv);

    // That card must expand
    expect(cardDiv.classList.contains("expanded")).toBe(true);

    // Other cards must collapse or become hidden
    const allCards = container.querySelectorAll(".features_card");
    allCards.forEach((otherCard, idx) => {
      if (idx !== index) {
        expect(otherCard.classList.contains("hidden")).toBe(true);
      }
    });

    // After each check, reset expandedCard by clicking again ("See less")
    const seeLessBtn = container.querySelector(".see_less button");
    if (seeLessBtn) {
      fireEvent.click(seeLessBtn);
    }
  });
});




test("does not expand feature card on mobile view", () => {
  window.innerWidth = 500;

  render(<Home />);

  const cardTitle = screen.getByText("Unified Dashboard");
  const cardDiv = cardTitle.closest(".features_card");

  fireEvent.click(cardDiv);

  expect(cardDiv.classList.contains("expanded")).toBe(false);
});



});
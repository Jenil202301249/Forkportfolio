import { render, screen, fireEvent } from "@testing-library/react";
import BotSidebar from "../../src/components/BotSidebar.jsx";
import { vi } from "vitest";

// ---- Mock Context ----
vi.mock("../../src/context/AppContext.jsx", () => ({
  useAppContext: () => ({
    userDetails: {
      name: "Gautam Modi",
      profileImage: "http://test-image.com/pic.jpg"
    }
  })
}));

// ---- Mock Assets (images) ----
vi.mock("../../src/assets/closeIcon.png", () => ({
  default: "close_icon.png"
}));

vi.mock("../../src/assets/openIcon.png", () => ({
  default: "open_icon.png"
}));

vi.mock("../../src/assets/profileicon.svg", () => ({
  default: "profileicon.png"
}));


describe("BotSidebar Component", () => {

test("renders sidebar in open state initially", () => {
  const { container } = render(<BotSidebar />);
  const sidebarRoot = container.firstChild;
  expect(sidebarRoot).toHaveClass("open");
  expect(sidebarRoot).not.toHaveClass("close");

  const toggleButton = screen.getByRole("img", {
    name: /toggle sidebar icon/i,
  });
  expect(toggleButton).toBeInTheDocument();
  expect(toggleButton).toHaveAttribute("src", "close_icon.png");

  expect(screen.getByText("What You Can Ask")).toBeInTheDocument();
  expect(
    screen.getByText(
      /Discover how InsightStox AI helps you understand markets/i
    )
  ).toBeInTheDocument();

  const profileImage = screen.getByAltText("profile icon");
  expect(profileImage).toBeInTheDocument();

  const userFirstName = screen.getByRole("heading", { level: 3 });
  expect(userFirstName).toHaveTextContent("Gautam");
});

  //check toggle functionality
test("toggles the sidebar open and closed when the toggle button is clicked", () => {
  const { container } = render(<BotSidebar />);

  const sidebarRoot = container.firstChild;
  const toggleBtn = screen.getByRole("img", { name: /toggle sidebar icon/i });
  expect(toggleBtn).toHaveAttribute("src", "close_icon.png");
  fireEvent.click(toggleBtn);

  expect(toggleBtn).toHaveAttribute("src", "open_icon.png");
  expect(sidebarRoot).toHaveClass("close");
  expect(sidebarRoot).not.toHaveClass("open");
  expect(screen.queryByText(/What You Can Ask/i)).not.toBeInTheDocument();

  fireEvent.click(toggleBtn);
  expect(sidebarRoot).toHaveClass("open");
  expect(toggleBtn).toHaveAttribute("src", "close_icon.png");
  expect(screen.getByText("What You Can Ask")).toBeInTheDocument();
  const img = screen.getByAltText("profile icon");
  expect(img).toHaveAttribute("src", "http://test-image.com/pic.jpg");
});

test("shows fallback profile icon and Guest name when userDetails has no profileImage or name", async () => {
  // Reset module cache so we can mock the context for this test only
  vi.resetModules();

  // Mock context only for this test (match the .jsx path used elsewhere)
  vi.doMock("../../src/context/AppContext.jsx", () => ({
    useAppContext: () => ({
      userDetails: { name: null, profileImage: null }
    })
  }));

   const BotSidebarFallback = (await import("../../src/components/BotSidebar.jsx")).default;

  render(<BotSidebarFallback />);
  const profileImg = screen.getByAltText("profile icon");
  expect(profileImg).toHaveAttribute("src", "profileicon.png");
  const nameHeading = screen.getByRole("heading", { level: 3 });
  expect(nameHeading).toHaveTextContent("Guest");
});  
});

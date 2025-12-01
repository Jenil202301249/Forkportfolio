import { Auth } from "../../src/pages/auth.jsx";
import { render, screen,fireEvent,waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

// ---- Mock Context ----
vi.mock("../../src/context/AppContext.jsx", () => ({
  useAppContext: () => ({
    ensureAuth: vi.fn(() => Promise.resolve())
  })
}));

// ---- Mock Components ----
vi.mock("../../src/components/LoginForm.jsx", () => ({
  default: () => <div data-testid="login-form">Login Form</div>,
}));

vi.mock("../../src/components/SignupForm.jsx", () => ({
  default: () => <div data-testid="signup-form">Signup Form</div>,
}));

// ---- Mock Assets ----
vi.mock("../../src/assets/dark-mode-login-bg.png", () => ({
  default: "bg_mock.png",
}));



vi.mock("../../src/components/LoginForm.jsx", () => ({
  default: ({ toggleForm }) => (
    <div>
      <div data-testid="login-form">Login Form</div>
      <button data-testid="mock-toggle" onClick={toggleForm}>Toggle</button>
    </div>
  ),
}));

// Import AFTER the mock so Auth receives the mocked LoginForm
const { Auth: AuthToggle } = await import("../../src/pages/auth.jsx");

describe("Auth Component", () => {

  test("Test 1: renders LoginForm by default", () => {
    sessionStorage.clear();

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    // Should show LoginForm initially
    expect(screen.getByTestId("login-form")).toBeInTheDocument();

    // Should NOT show SignupForm
    expect(screen.queryByTestId("signup-form")).not.toBeInTheDocument();
  });

  test("Test 2: renders SignupForm when isLogin = false in sessionStorage", () => {
    sessionStorage.setItem("isLogin", "false");

    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    // Should show SignupForm
    expect(screen.getByTestId("signup-form")).toBeInTheDocument();

    // Should NOT show LoginForm
    expect(screen.queryByTestId("login-form")).not.toBeInTheDocument();
  });

  test("Test 3: toggleForm updates state and sessionStorage, switching LoginForm → SignupForm", () => {
  sessionStorage.clear();

  render(
    <MemoryRouter>
      <AuthToggle />
    </MemoryRouter>
  );

  // Initially LoginForm must be visible
  expect(screen.getByTestId("login-form")).toBeInTheDocument();
  expect(sessionStorage.getItem("isLogin")).toBe(null);

  // Click mock toggle button to trigger toggleForm
  fireEvent.click(screen.getByTestId("mock-toggle"));

  // Should now show SignupForm
  expect(screen.getByTestId("signup-form")).toBeInTheDocument();

  // LoginForm should disappear
  expect(screen.queryByTestId("login-form")).not.toBeInTheDocument();

  // sessionStorage MUST be updated to "false"
  expect(sessionStorage.getItem("isLogin")).toBe("false");
});


test("Test 4+5: Back button and popstate event both trigger resetFormStates() and clear sessionStorage", () => {
  // ---- Case 1: Back Button ----
  sessionStorage.setItem("isLogin", "true");
  sessionStorage.setItem("forgotpassword", "yes");

  render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );

  const backButton = screen.getByRole("button", { name: /back/i });
  fireEvent.click(backButton);

  expect(sessionStorage.getItem("isLogin")).toBe(null);
  expect(sessionStorage.getItem("forgotpassword")).toBe(null);

  // ---- Case 2: popstate event ----
  sessionStorage.setItem("isLogin", "true");
  sessionStorage.setItem("forgotpassword", "yes");

  // Trigger browser back event
  window.dispatchEvent(new PopStateEvent("popstate"));

  expect(sessionStorage.getItem("isLogin")).toBe(null);
  expect(sessionStorage.getItem("forgotpassword")).toBe(null);
});

test("Test 6: console.error is called when ensureAuth initial check fails", async () => {
  // Reset module cache to apply fresh mocks
  vi.resetModules();

  // Spy on console.error
  const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  // Mock context BEFORE importing Auth
  vi.doMock("../../src/context/AppContext.jsx", () => ({
    useAppContext: () => ({
      ensureAuth: () => Promise.reject("AUTH_ERROR")
    })
  }));

  // Re-import Auth AFTER mock
  const { Auth: AuthFailCheck } = await import("../../src/pages/auth.jsx");

  render(
    <MemoryRouter>
      <AuthFailCheck />
    </MemoryRouter>
  );

  // Wait until the rejected ensureAuth triggers console.error
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalled();
  });

  consoleSpy.mockRestore();
});

test("Test 7: ensureAuth is called repeatedly by setInterval every 5000ms", async () => {
  // Use fake timers for setInterval
  vi.useFakeTimers();
  vi.resetModules();

  // Create a mock ensureAuth
  const ensureAuthMock = vi.fn(() => Promise.resolve());

  // Mock context BEFORE importing Auth
  vi.doMock("../../src/context/AppContext.jsx", () => ({
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * useAppContext hook returns an object containing ensureAuth function
 * ensureAuth: a function that takes a navigate function and a boolean value
 *   indicating whether to check for authentication or not, and returns a promise
 *   that resolves if the user is authenticated, or rejects if not
 * @return {object} an object with ensureAuth function
/*******  9b77fbd1-836f-402f-b424-859668a3f14d  *******/
    useAppContext: () => ({
      ensureAuth: ensureAuthMock
    })
  }));

  // Import Auth AFTER the mock
  const { Auth: AuthIntervalTest } = await import("../../src/pages/auth.jsx");

  render(
    <MemoryRouter>
      <AuthIntervalTest />
    </MemoryRouter>
  );

  // Immediately after mount, useEffect should call ensureAuth once
  expect(ensureAuthMock).toHaveBeenCalledTimes(1);

  // Advance time by 5000ms → interval fires once
  vi.advanceTimersByTime(5000);
  expect(ensureAuthMock).toHaveBeenCalledTimes(2);

  // Advance another 5000ms → interval fires twice
  vi.advanceTimersByTime(5000);
  expect(ensureAuthMock).toHaveBeenCalledTimes(3);

  vi.useRealTimers();
});






});

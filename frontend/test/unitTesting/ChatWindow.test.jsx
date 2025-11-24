import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi } from "vitest";
import ChatWindow from "../../src/components/ChatWindow";
import axios from "axios";

// Mock axios globally for this file
vi.mock("axios");
// Mock Context (minimum for now)
vi.mock("../../src/context/AppContext", () => ({
  useAppContext: () => ({
    userDetails: { name: "Gautam Modi" }
  })
}));

// Mock CSS imports (needed if CSS causes errors)
vi.mock("../../src/components/ChatWindow.css", () => ({}));

describe("ChatWindow Component", () => {
  test("renders welcome message", () => {
  const { container } = render(<ChatWindow />);
    // 1️⃣ Welcome message should be visible
  expect(screen.getByText("Hello,")).toBeInTheDocument();
  expect(screen.getByText("How can I help you Today?")).toBeInTheDocument();

  // 2️⃣ Username should be displayed correctly (first name only)
  const userName = screen.getByText("Gautam!");
  expect(userName).toBeInTheDocument();

  const userNameGuest = screen.queryByText("Guest!");
  expect(userNameGuest).not.toBeInTheDocument();

  // 3️⃣ Chat messages area should be hidden initially
  const chatMessages = container.querySelector(".chat-messages");
  expect(chatMessages).toHaveStyle("display: none");

  // 4️⃣ Input should start empty
  const inputBox = screen.getByPlaceholderText("Type a message...");
  expect(inputBox.value).toBe("");

  // 5️⃣ Chat should not have started (chatStart = false)
  const welcomeContainer = container.querySelector(".chat-welcome-message");
  expect(welcomeContainer).not.toHaveStyle("display: none");

  });

  test("shows 'Guest!' in the welcome message when user has no name", async () => {
    // Temporarily override the mock for this specific test
    vi.resetModules();
    vi.doMock("../../src/context/AppContext.jsx", () => ({
      useAppContext: () => ({
        userDetails: {
            name : null,
            profileImage: null
        }, // Simulate a user with no name
      }),
    }));

    const { default: ChatWindowFallback } = await import(
    "../../src/components/ChatWindow.jsx"
  );
     const { container } = render(<ChatWindowFallback />);
    // 1️⃣ "Guest" should appear (first name fallback)
  const guestText = screen.getByText(/Guest/i);
  expect(guestText).toBeInTheDocument();


  // 3️⃣ Chat messages area must be hidden (chatStart = false)
  const chatMessages = container.querySelector(".chat-messages");
  expect(chatMessages).toHaveStyle("display: none");

  // 4️⃣ Input should start empty
  const inputBox = screen.getByPlaceholderText("Type a message...");
  expect(inputBox.value).toBe("");

  // 5️⃣ Welcome container should NOT be hidden
  const welcomeBox = container.querySelector(".chat-welcome-message");
  expect(welcomeBox).not.toHaveStyle("display: none");
});
test("pressing Enter sends message, starts chat, and shows typing bubble", () => {
  render(<ChatWindow />);

  const input = screen.getByPlaceholderText("Type a message...");

  // 1️⃣ Type into input
  fireEvent.change(input, { target: { value: "Hello bot" } });
  expect(input.value).toBe("Hello bot");     // confirm typing

  // 2️⃣ Press Enter → should trigger handleSend()
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

  // 3️⃣ Input should be cleared after sending
  expect(input.value).toBe("");

  // 4️⃣ Welcome message should disappear (chatStart = true)
  const welcomeMessage = screen.queryByText("<h3>How can I help you Today?</h3>");
  expect(welcomeMessage).not.toBeInTheDocument();

  // 5️⃣ User message should appear immediately
  expect(screen.getByText("Hello bot")).toBeInTheDocument();

  // 6️⃣ Typing bubble should appear immediately
  expect(screen.getByText(/Bot is typing/i)).toBeInTheDocument();
});

test("sends message, shows user message, removes typing bubble, and displays bot reply on success", async () => {
  // 1️⃣ Mock API response
  axios.post.mockResolvedValue({
    data: {
      reply: "Hello from bot!" // markdown to test ReactMarkdown rendering
    }
  });

  const { container } = render(<ChatWindow />);

  const input = screen.getByPlaceholderText("Type a message...");
  const sendBtn = screen.getByRole("button", { name: /send/i });

  // 2️⃣ User types text
  fireEvent.change(input, { target: { value: "Hi bot" } });
  expect(input.value).toBe("Hi bot");

  // 3️⃣ User clicks "Send"
  fireEvent.click(sendBtn);

  // 4️⃣ Input should be cleared
  expect(input.value).toBe("");

  // 5️⃣ User message should appear immediately
  expect(screen.getByText("Hi bot")).toBeInTheDocument();

  // 6️⃣ Typing bubble should appear
  expect(screen.getByText(/Bot is typing/i)).toBeInTheDocument();

  // 7️⃣ Bot reply should appear after API resolves (markdown parsed)
  const botReply = await screen.findByText("Hello from bot!", { exact: false });
  expect(botReply).toBeInTheDocument();

  // 8️⃣ Typing bubble should be removed
  expect(screen.queryByText(/Bot is typing/i)).not.toBeInTheDocument();

  // 9️⃣ Loader (RingLoader) should stop
  const inputArea = container.querySelector(".chat-input-area");
  expect(inputArea).not.toHaveClass("loading");
});

test("shows error message, removes typing bubble, and stops loading when axios request fails", async () => {
  // 1️⃣ Mock axios failure
  axios.post.mockRejectedValue(new Error("Network error"));

  const { container } = render(<ChatWindow />);

  const input = screen.getByPlaceholderText("Type a message...");
  const sendBtn = screen.getByRole("button", { name: /send/i });

  // 2️⃣ Type a message
  fireEvent.change(input, { target: { value: "Hello" } });
  expect(input.value).toBe("Hello");

  // 3️⃣ Click Send (trigger handleSend)
  fireEvent.click(sendBtn);

  // 4️⃣ Input must clear immediately after sending
  expect(input.value).toBe("");

  // 5️⃣ A user message should appear immediately
  expect(screen.getByText("Hello")).toBeInTheDocument();

  // 6️⃣ Typing bubble should appear BEFORE error resolves
  expect(screen.getByText(/Bot is typing/i, { exact: false })).toBeInTheDocument();

  // 7️⃣ Error message should appear after axios fails
  const errorMsg = await screen.findByText("Network error", { exact: false });
  expect(errorMsg).toBeInTheDocument();

  // 8️⃣ Typing bubble must be removed after failure
  expect(screen.queryByText(/Bot is typing/i)).not.toBeInTheDocument();

  // 9️⃣ Loading state must stop → `.loading` class removed
  const inputArea = container.querySelector(".chat-input-area");
  expect(inputArea).not.toHaveClass("loading");

  // 🔟 Welcome message should disappear (chatStart = true)
  const welcomeBox = container.querySelector(".chat-welcome-message");
  expect(welcomeBox).toHaveStyle("display: none");
});
test("does not send a message if the input is empty", () => {
  // Reset axios mock calls
  axios.post.mockClear();

  const { container } = render(<ChatWindow />);

  const sendBtn = screen.getByRole("button", { name: /send/i });
  const input = screen.getByPlaceholderText("Type a message...");

  // 1️⃣ Ensure input starts empty
  expect(input.value).toBe("");

  // 2️⃣ Click send with empty input
  fireEvent.click(sendBtn);

  // 3️⃣ axios should not be called
  expect(axios.post).not.toHaveBeenCalled();

  // 4️⃣ Typing bubble should NOT appear
  expect(screen.queryByText(/Bot is typing/i)).not.toBeInTheDocument();

  // 5️⃣ Chat window should still show welcome message (chatStart still = false)
  const welcome = container.querySelector(".chat-welcome-message");
  expect(welcome).not.toHaveStyle("display: none");

  // 7️⃣ Chat messages area should still be hidden
  const chatMessages = container.querySelector(".chat-messages");
  expect(chatMessages).toHaveStyle("display: none");

  // 8️⃣ Input should remain empty
  expect(input.value).toBe("");

  // 9️⃣ Input area should not show loading state
  const inputArea = container.querySelector(".chat-input-area");
  expect(inputArea).not.toHaveClass("loading");

  // 🔟 Test pressing Enter with empty input (should also do nothing)
  fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
  expect(axios.post).not.toHaveBeenCalled();
});

});


describe("useEffect for scrolling", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
      vi.useRealTimers();
    });



  test("scrolls to the bottom when a new message is added", async () => {
    // 1. Setup a controllable promise for the API call
    let resolvePost;
    const postPromise = new Promise(resolve => {
      resolvePost = resolve;
    });
    axios.post.mockReturnValue(postPromise);

    render(<ChatWindow />);
    const input = screen.getByPlaceholderText("Type a message...");

    // 2. Simulate user sending a message
    fireEvent.change(input, { target: { value: "User message" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    // 3. The first state update has happened. Advance timers for the first scroll.
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Assert the first scroll happened (after user message + typing indicator)
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1);

    // 4. Now, resolve the API call to trigger the second state update
    await act(async () => {
      resolvePost({ data: { reply: "This is a new message" } });
      await postPromise; // Ensure the promise is fully processed
    });

    // 5. The second state update has happened. Advance timers for the second scroll.
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Assert the scroll was called again (after bot reply was added)
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
    });
  });  
});

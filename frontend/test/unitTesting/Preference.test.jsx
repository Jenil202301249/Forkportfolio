import { describe, test, expect, beforeEach, beforeAll, vi, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor, cleanup, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import { Preference } from '../../src/pages/Preference'


// --- Global Mocks ---
beforeAll(() => {
  window.alert = vi.fn();
  window.scrollTo = vi.fn();
});


vi.mock('axios')
let mockEnsureAuth = vi.fn();

// --- Component Mocks ---
vi.mock('../../src/components/Navbar.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar-mock">Navbar</div>,
}))

vi.mock('../../src/components/Sidebar.jsx', () => ({
  __esModule: true,
  Sidebar: () => <div data-testid="sidebar-mock">Sidebar</div>,
}))

vi.mock('../../src/components/Footer.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="footer-mock">Footer</div>,
}))

vi.mock('../../src/context/AppContext.jsx', () => ({
  __esModule: true,
  useAppContext: () => ({
    darkMode: false,
    setDarkMode: vi.fn(),
    userDetails: { name: 'Test', email: 'test@test.com', profileImage: 'img.jpg' },
    ensureAuth: (...args) => mockEnsureAuth(...args), // ✅ dynamic
  }),
}));


vi.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => vi.fn(),
}))

describe('Preference Page – Optimized Coverage Tests', () => {

beforeEach(() => {
  vi.clearAllMocks()

  mockEnsureAuth = vi.fn().mockResolvedValue(true) // ✅ default success

  axios.get.mockResolvedValue({
    data: {
      success: true,
      data: {
        theme: 'Dark',
        dashboardlayout: 'Simple (Essential Metrics)',
      },
    },
  })

  axios.patch.mockResolvedValue({ data: { success: true } })
})


  afterEach(cleanup)

  // 1. Render test
  test('1. Renders full layout', async () => {
    render(<Preference />)

    await waitFor(() => {
      expect(screen.getByText('Preferences & Personalisation')).toBeInTheDocument()
    })
  })

  // 2. Successful GET
  test('2. Covers successful GET fetch', async () => {
    render(<Preference />)

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled()
    })
  })

  // 3. GET failure (network error)
test('3. Covers GET failure (catch block)', async () => {
  axios.get.mockClear()
  axios.get.mockRejectedValueOnce(new Error('Network Error'))

  render(<Preference />)

  // Wait until GET request actually fires
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalled()
  })

  // Now wait for alert to be triggered
  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith(
      'Failed to load preferences. Please check your connection.'
    )
  })
})

  // 4. Theme PATCH success
  test('4. Covers Theme PATCH success branch', async () => {
    render(<Preference />)

    const themeSelect = await screen.findByLabelText('Theme')

    await act(async () => {
      fireEvent.change(themeSelect, { target: { value: 'Light' } })
    })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Theme updated successfully!')
    })
  })

  // 5. Layout PATCH success
  test('5. Covers Layout PATCH success branch', async () => {
    render(<Preference />)

    const layoutSelect = await screen.findByLabelText('Dashboard Layout')

    await act(async () => {
      fireEvent.change(layoutSelect, {
        target: { value: 'Detailed (Advanced Insights)' },
      })
    })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Layout updated successfully!')
    })
  })

  // 6. PATCH error handling
  test('6. Covers PATCH catch block', async () => {
    axios.patch.mockRejectedValueOnce(new Error('Patch Error'))

    render(<Preference />)

    const themeSelect = await screen.findByLabelText('Theme')

    await act(async () => {
      fireEvent.change(themeSelect, { target: { value: 'Light' } })
    })

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Something went wrong while saving preferences. Check your internet or try again.'
      )
    })
  })
  test('7. Covers GET success false branch', async () => {
  axios.get.mockClear()
  axios.get.mockResolvedValueOnce({
    data: { success: false }
  })

  render(<Preference />)

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalled()
  })

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('Could not fetch your preferences.')
  })
})

test('8. Covers ensureAuth interval catch block', async () => {
  vi.useFakeTimers()

  // Spy console.error
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  // First call = OK, second call = FAIL
  mockEnsureAuth
    .mockResolvedValueOnce(true)
    .mockRejectedValueOnce(new Error('Auth failed'))

  render(<Preference />)

  // Fast-forward setInterval(10000)
  await act(async () => {
    vi.advanceTimersByTime(10000)
  })

  // Now error should be called
  expect(errorSpy).toHaveBeenCalled()

  vi.useRealTimers()
})



test('9. Covers layout update failed (success: false branch)', async () => {
  axios.patch.mockResolvedValueOnce({ data: { success: false } })

  render(<Preference />)

  const layoutSelect = await screen.findByLabelText('Dashboard Layout')

  await act(async () => {
    fireEvent.change(layoutSelect, {
      target: { value: 'Detailed (Advanced Insights)' },
    })
  })

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('Failed to update layout.')
  })
})


test('10. Covers theme update failed (success: false branch)', async () => {
  axios.patch.mockResolvedValueOnce({ data: { success: false } })

  render(<Preference />)

  const themeSelect = await screen.findByLabelText('Theme')

  await act(async () => {
    fireEvent.change(themeSelect, { target: { value: 'Light' } })
  })

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('Failed to update theme.')
  })
})

test('11. Covers default fallback values for theme and layout', async () => {
  axios.get.mockClear()

  axios.get.mockResolvedValueOnce({
    data: {
      success: true,
      data: {
        theme: null,                 // ✅ force fallback
        dashboardlayout: null        // ✅ force fallback
      }
    }
  })

  render(<Preference />)

  await waitFor(() => {
    expect(axios.get).toHaveBeenCalled();
  })
})

  test('12. Covers initial ensureAuth failure (catch block)', async () => {
    // .mockImplementation(() => {}) prevents the error from cluttering your terminal
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // 2. Force the mocked ensureAuth to fail IMMEDIATELY (once)
    // This simulates the error happening on the very first render
    mockEnsureAuth.mockRejectedValueOnce(new Error('Immediate Auth Fail'))

    render(<Preference />)

    // 4. Wait for the useEffect async function to hit the catch block
    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "ensureAuth initial check failed:",
        expect.any(Error)
      )
    })

    // 5. Clean up the spy
    errorSpy.mockRestore()
  })


})

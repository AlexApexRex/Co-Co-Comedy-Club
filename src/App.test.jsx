import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { SavedProvider } from './context/SavedContext';

afterEach(() => { cleanup(); sessionStorage.clear(); });
function site(route = '/') {
  return render(<MemoryRouter initialEntries={[route]}>
    <AuthProvider><ContentProvider><SavedProvider><App/></SavedProvider></ContentProvider></AuthProvider>
  </MemoryRouter>);
}
describe('community experience in local demo mode', () => {
  it('renders the rebranded homepage and real feed cards', async () => {
    site();
    expect(screen.getByText(/Better shared/i)).toBeTruthy();
    expect(await screen.findByText(/A classic from the internet/i)).toBeTruthy();
  });
  it('navigates from videos to jokes through real routes', async () => {
    site('/videos');
    fireEvent.click(screen.getAllByRole('link', { name: 'Jokes' })[0]);
    expect(await screen.findByText('A little laugh goes a long way.')).toBeTruthy();
    expect(screen.getByText(/A little self-awareness/i)).toBeTruthy();
  });
  it('allows a guest to submit a joke without an account', async () => {
    site('/submit/joke');
    fireEvent.change(screen.getByPlaceholderText('Okay, so here’s the funny part…'), { target: { value: 'This is my original test joke.' } });
    fireEvent.click(screen.getByRole('button', { name: /Post your joke/i }));
    expect(await screen.findByText('This is my original test joke.')).toBeTruthy();
  });
  it('opens a sign-in prompt when a guest tries to vote', async () => {
    site('/jokes');
    const buttons = await screen.findAllByRole('button', { name: 'Like' });
    fireEvent.click(buttons[0]);
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/An account is only needed to vote/i)).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('previews a YouTube clip and submits without a login', async () => {
    site('/submit/video');
    fireEvent.change(screen.getByPlaceholderText('https://youtube.com/watch?v=...'), { target: { value: 'https://youtu.be/dQw4w9WgXcQ' } });
    expect(screen.getByAltText('YouTube video preview')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Give this clip a name'), { target: { value: 'Guest submission test' } });
    fireEvent.click(screen.getByRole('button', { name: /Share this video/i }));
    expect(await screen.findByText('Guest submission test')).toBeTruthy();
  });
  it('requires a valid video link before enabling submit', () => {
    site('/submit/video');
    fireEvent.change(screen.getByPlaceholderText('https://youtube.com/watch?v=...'), { target: { value: 'https://example.com/not-a-video' } });
    expect(screen.getByRole('button', { name: /Share this video/i }).disabled).toBe(true);
    expect(screen.getByText(/Use a valid YouTube video URL/i)).toBeTruthy();
  });
  it('supports switching and removing votes in demo mode', async () => {
    site('/jokes');
    fireEvent.click((await screen.findAllByRole('button', { name: 'Like' }))[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Try demo member' }));
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Like' })[0].disabled).toBe(false));
    fireEvent.click(screen.getAllByRole('button', { name: 'Like' })[0]);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Like' })[0].getAttribute('aria-pressed')).toBe('true'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Dislike' })[0]);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Dislike' })[0].getAttribute('aria-pressed')).toBe('true'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Dislike' })[0]);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Dislike' })[0].getAttribute('aria-pressed')).toBe('false'));
  });
  it('allows guest comments in demo mode', async () => {
    site('/jokes/joke-1');
    const textarea = await screen.findByPlaceholderText('Add something to the conversation...');
    fireEvent.change(textarea, { target: { value: 'A test comment for the discussion.' } });
    fireEvent.click(screen.getByRole('button', { name: /Post comment/i }));
    expect(await screen.findByText('A test comment for the discussion.')).toBeTruthy();
  });
});

function BackButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Browser back</button>;
}
it('uses router history to return to a feed', async () => {
  render(<MemoryRouter initialEntries={['/jokes', '/jokes/joke-1']} initialIndex={1}>
    <AuthProvider><ContentProvider><SavedProvider><App/><BackButton/></SavedProvider></ContentProvider></AuthProvider>
  </MemoryRouter>);
  expect(await screen.findByText(/Join the discussion/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
  expect(await screen.findByText('A little laugh goes a long way.')).toBeTruthy();
});

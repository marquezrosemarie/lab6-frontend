import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowDownUp, Box, Check, ChevronDown, CircleHelp, Eye, EyeOff, LogOut, PackagePlus, Pencil, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'fieldnotes.accessToken';
const REFRESH_KEY = 'fieldnotes.refreshToken';
const USER_KEY = 'fieldnotes.user';
const LOGO_PATH = '/4ef9f709-5122-47f7-a6d9-99e56bfb2f58.png';

async function request(path, { token, ...options } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const send = accessToken => fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  });
  let response = await send(localStorage.getItem(TOKEN_KEY) || token);
  let data = await response.json().catch(() => ({}));

  if (response.status === 401 && token && path !== '/api/auth/refresh') {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const refreshed = await refreshResponse.json().catch(() => ({}));
        if (refreshResponse.ok) {
          localStorage.setItem(TOKEN_KEY, refreshed.tokens.access_token);
          localStorage.setItem(REFRESH_KEY, refreshed.tokens.refresh_token);
          if (path === '/api/auth/logout' && options.body) {
            const logoutBody = JSON.parse(options.body);
            logoutBody.refresh_token = refreshed.tokens.refresh_token;
            options.body = JSON.stringify(logoutBody);
          }
          response = await send(refreshed.tokens.access_token);
          data = await response.json().catch(() => ({}));
        }
      } catch { /* Keep the original response if refreshing is unavailable. */ }
    }
  }

  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await request(`/api/auth/${mode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <div className="brand auth-brand"><span className="logo-window auth-logo-window"><img src={LOGO_PATH} alt="RoseStock" /></span><span className="brand-divider">/</span><span>INVENTORY</span></div>
        <div className="story-copy">
          <p className="eyebrow"><span className="status-dot" /> SMALL BUSINESS TOOLKIT</p>
          <h1>Keep the good<br />things <em>moving.</em></h1>
          <p className="story-note">A clear view of what you have, what it costs, and what needs attention next.</p>
        </div>
        <div className="story-bottom"><span>PRODUCT OPERATIONS</span><span>01 / 06</span></div>
        <div className="auth-decoration" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Box size={34} strokeWidth={1.2} /></div><span className="orbit-label">CATALOG<br />CONTROL</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top"><span>YOUR WORKSPACE</span><span className="secure-label"><ShieldCheck size={14} /> SECURE ACCESS</span></div>
        <div className="auth-form-wrap">
          <p className="eyebrow form-eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</p>
          <h2>{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</h2>
          <p className="form-subtitle">{mode === 'login' ? 'Your inventory is right where you left it.' : 'Set up a workspace to manage your products.'}</p>
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && <label htmlFor="username">Username<input id="username" name="username" autoComplete="username" minLength="3" maxLength="100" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="How should we call you?" /></label>}
            <label htmlFor="email">Email address<input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></label>
            <label htmlFor="password">Password<div className="password-control"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength="8" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<span aria-hidden="true">↗</span></button>
          </form>
          <p className="auth-switch">{mode === 'login' ? 'New to RoseStock?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></p>
        </div>
        <p className="auth-footnote">By continuing, you agree to keep your workspace credentials private.</p>
      </section>
    </main>
  );
}

function ProductDialog({ product, onClose, onSave }) {
  const [form, setForm] = useState(product || { product_name: '', description: '', price: '', quantity: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({ ...form, price: Number(form.price), quantity: Number(form.quantity) });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog-heading"><div><p className="eyebrow">CATALOG ENTRY</p><h2 id="dialog-title">{product ? 'Edit product' : 'Add a product'}</h2></div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
      <form className="product-form" onSubmit={submit}>
        <label htmlFor="product-name">Product name<input id="product-name" name="product_name" autoFocus required maxLength="100" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="e.g. Ceramic pour-over set" /></label>
        <label htmlFor="description">Description<textarea id="description" name="description" rows="3" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A short note about this item" /></label>
        <div className="form-grid"><label htmlFor="price">Price<input id="price" name="price" type="number" min="0" max="99999999.99" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" /></label><label htmlFor="quantity">Quantity<input id="quantity" name="quantity" type="number" min="0" step="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" /></label></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}</button></div>
      </form>
    </section>
  </div>;
}

function DeleteDialog({ product, onCancel, onConfirm, busy }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && !busy && onCancel()}>
    <section className="dialog delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
      <div className="delete-emblem"><Trash2 size={21} /></div>
      <p className="eyebrow">ONE LAST CHECK</p>
      <h2 id="delete-title">Remove this product?</h2>
      <p id="delete-description">“{product.product_name}” will be removed from your inventory.</p>
      <div className="dialog-actions"><button type="button" className="button button-quiet" disabled={busy} onClick={onCancel}>Keep it</button><button type="button" className="button button-danger" disabled={busy} onClick={onConfirm}>{busy ? 'Removing…' : 'Remove product'}</button></div>
    </section>
  </div>;
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const Icon = toast.type === 'error' ? AlertCircle : Check;
  return <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'}>
    <span className="toast-icon"><Icon size={16} /></span><span>{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={onDismiss}><X size={15} /></button>
  </div>;
}

function Dashboard({ user, token, onLogout }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const searchInput = useRef(null);
  const [dialogProduct, setDialogProduct] = useState(undefined);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortLow, setSortLow] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  async function loadProducts() {
    setError('');
    try {
      const data = await request('/api/products', { token });
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
      if (err.message === 'Unauthorized') onLogout(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    function focusSearch(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  async function saveProduct(fields) {
    const editing = dialogProduct && dialogProduct !== null;
    const path = editing ? `/api/products/${dialogProduct.id}` : '/api/products';
    await request(path, { token, method: editing ? 'PUT' : 'POST', body: JSON.stringify(fields) });
    await loadProducts();
    setToast({ type: 'success', message: editing ? 'Product details saved.' : 'Product added to your inventory.' });
  }

  async function deleteProduct(product) {
    setDeleting(true);
    try {
      await request(`/api/products/${product.id}`, { token, method: 'DELETE' });
      setProducts(current => current.filter(item => item.id !== product.id));
      setPendingDelete(null);
      setToast({ type: 'success', message: 'Product removed from your inventory.' });
    } catch (err) {
      setError(err.message);
      setToast({ type: 'error', message: err.message });
    } finally {
      setDeleting(false);
    }
  }

  const filtered = products.filter(item => `${item.product_name} ${item.description}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sortLow ? a.quantity - b.quantity : b.quantity - a.quantity);
  const inventoryValue = products.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
  const lowStock = products.filter(item => Number(item.quantity) < 5).length;

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand sidebar-brand" href="#top" aria-label="RoseStock home"><span className="logo-window sidebar-logo-window"><img src={LOGO_PATH} alt="" /></span></a><div className="workspace-switch"><span className="workspace-avatar">{(user.username || 'U').slice(0, 1).toUpperCase()}</span><span><strong>{user.username}</strong><small>My workspace</small></span><ChevronDown size={15} /></div><p className="nav-caption">WORKSPACE</p><a href="#inventory" className="nav-item nav-item-active"><Box size={17} /> Products <span>{products.length}</span></a><div className="sidebar-bottom"><div className="help-note"><CircleHelp size={17} /><span><strong>Need a hand?</strong><small>Inventory help</small></span><ChevronDown size={14} /></div><button className="nav-item logout-button" onClick={onLogout}><LogOut size={17} /> Sign out</button><div className="sidebar-meta">ROSESTOCK <span>·</span> INVENTORY TOOL</div></div></aside>
    <main className="main-content" id="top"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Products</strong></div><div className="topbar-right"><span className="api-status"><span /> CONNECTED</span><span className="topbar-date">CATALOG / 01</span><button className="mobile-logout icon-button" aria-label="Sign out" onClick={onLogout}><LogOut size={18} /></button></div></header>
      <section className="page-heading" id="inventory"><div><p className="eyebrow">YOUR CATALOG <span className="heading-rule" /></p><h1>Products <span>{String(products.length).padStart(2, '0')}</span></h1><p className="page-subtitle">A thoughtful view of everything in your inventory.</p></div><button className="button button-primary add-button" onClick={() => setDialogProduct(null)}><Plus size={17} /> Add product</button></section>
      <section className="metrics" aria-label="Inventory summary"><div className="metric"><span className="metric-label">TOTAL ITEMS</span><div>{products.length}<span className="metric-icon mint"><Box size={17} /></span></div><small>Distinct products in catalog</small></div><div className="metric"><span className="metric-label">INVENTORY VALUE</span><div>₱{inventoryValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span className="metric-icon peach">↗</span></div><small>Based on current quantity</small></div><div className="metric"><span className="metric-label">LOW STOCK</span><div>{String(lowStock).padStart(2, '0')}<span className="metric-icon yellow"><PackagePlus size={17} /></span></div><small>Items with fewer than 5 units</small></div></section>
      <section className="catalog-section"><div className="catalog-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>Product list</h2></div><span className="result-count">{filtered.length} {filtered.length === 1 ? 'ITEM' : 'ITEMS'}</span></div>
        <div className="table-toolbar"><label className="search-box"><Search size={16} /><input ref={searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products" aria-label="Search products" /><kbd>⌘ K</kbd></label><button className={`filter-button ${sortLow ? 'filter-active' : ''}`} onClick={() => setSortLow(!sortLow)}><ArrowDownUp size={15} /> Stock {sortLow ? 'low to high' : 'high to low'}</button></div>
        {error && <div className="notice-error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
        <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>DESCRIPTION</th><th>PRICE</th><th>IN STOCK</th><th>ADDED</th><th><span className="sr-only">ACTIONS</span></th></tr></thead><tbody>
          {loading ? <tr><td colSpan="6" className="empty-state"><span className="loading-indicator" /> Loading your catalog…</td></tr> : filtered.length === 0 ? <tr><td colSpan="6" className="empty-state"><span className="empty-icon"><Box size={20} /></span><strong>{search ? 'No matching products' : 'Your catalog is ready'}</strong><span>{search ? 'Try another search term.' : 'Add your first product to start tracking inventory.'}</span>{!search && <button className="button button-secondary" onClick={() => setDialogProduct(null)}><Plus size={15} /> Add first product</button>}</td></tr> : filtered.map(product => <tr key={product.id}><td><div className="product-cell"><span className="product-thumbnail"><Box size={17} /></span><strong>{product.product_name}</strong></div></td><td className="description-cell">{product.description || <span className="muted">No description</span>}</td><td className="price-cell">₱{Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td><span className={`stock-pill ${Number(product.quantity) < 5 ? 'stock-low' : 'stock-ok'}`}><span />{product.quantity} units</span></td><td className="date-cell">{new Date(`${product.created_at.replace(' ', 'T')}Z`).toLocaleDateString('en-PH', { day: '2-digit', month: 'short', year: 'numeric' })}</td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${product.product_name}`} title="Edit product" onClick={() => setDialogProduct(product)}><Pencil size={15} /></button><button className="icon-button delete-action" aria-label={`Delete ${product.product_name}`} title="Delete product" onClick={() => setPendingDelete(product)}><Trash2 size={15} /></button></div></td></tr>)}
        </tbody></table></div>
        <div className="table-footer"><span><Check size={14} /> All changes save to your workspace</span><span>Showing {filtered.length} of {products.length}</span></div>
      </section>
      <footer className="page-footer"><span>ROSESTOCK INVENTORY SYSTEM</span><span>BUILT FOR THE EVERYDAY WORK</span></footer>
    </main>
    {dialogProduct !== undefined && <ProductDialog product={dialogProduct || undefined} onClose={() => setDialogProduct(undefined)} onSave={saveProduct} />}
    {pendingDelete && <DeleteDialog product={pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={() => deleteProduct(pendingDelete)} busy={deleting} />}
    <Toast toast={toast} onDismiss={() => setToast(null)} />
  </div>;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });

  function login(data) {
    localStorage.setItem(TOKEN_KEY, data.tokens.access_token);
    localStorage.setItem(REFRESH_KEY, data.tokens.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setToken(data.tokens.access_token);
    setUser(data.user);
  }

  async function logout(notify = true) {
    if (notify && token) {
      try {
        await request('/api/auth/logout', { token, method: 'POST', body: JSON.stringify({ refresh_token: localStorage.getItem(REFRESH_KEY) }) });
      } catch { /* Clear local credentials even if the API is unavailable. */ }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return token && user ? <Dashboard user={user} token={token} onLogout={logout} /> : <AuthScreen onLogin={login} />;
}
import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, UserRound, Menu, X, ArrowRight, ShieldCheck, Truck, Headphones, CalendarDays, Laptop, Smartphone, Camera, Tablet, Watch, CheckCircle2, LogOut, Package, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
const categories = ['All','Mobiles','Laptops','Tablets','Cameras','Accessories'];
const icons = {Mobiles: Smartphone, Laptops: Laptop, Tablets: Tablet, Cameras: Camera, Accessories: Headphones};
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const today = () => new Date().toISOString().slice(0,10);

function App() {
  const [products,setProducts]=useState([]);
  const [category,setCategory]=useState('All');
  const [query,setQuery]=useState('');
  const [user,setUser]=useState(()=>{
    try {
      const stored = localStorage.getItem('re_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token,setToken]=useState(()=>localStorage.getItem('re_token')||'');
  const [modal,setModal]=useState(null);
  const [selected,setSelected]=useState(null);
  const [bookings,setBookings]=useState([]);
  const [toast,setToast]=useState('');
  const [mobileNav,setMobileNav]=useState(false);
  const [page,setPage]=useState('home');
  const [authMode,setAuthMode]=useState('login');
  const [authForm,setAuthForm]=useState({name:'',email:'',password:''});
  const [rental,setRental]=useState({startDate:today(),endDate:today()});
  const [busy,setBusy]=useState(false);

  const headers=token?{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}:{'Content-Type':'application/json'};
  const notify=msg=>{setToast(msg);setTimeout(()=>setToast(''),3200)};

  async function loadProducts(){
    try {
      const r = await fetch(`${API}/products`);
      if(!r.ok) throw Error('Server responded with an error');
      const data = await r.json();
      setProducts(data);
    } catch {
      notify('Cannot reach the server. Start the backend and MongoDB first.');
    }
  }

  async function loadBookings(){
    if(!token) return;
    try {
      const r = await fetch(`${API}/bookings/mine`,{headers});
      if(r.ok) setBookings(await r.json());
    } catch {}
  }

  useEffect(()=>{loadProducts();},[]);
  useEffect(()=>{loadBookings();},[token]);

  const filtered=useMemo(()=>products.filter(p=>(category==='All'||p.category===category)&&`${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(query.toLowerCase())),[products,category,query]);
  const featured=products.filter(p=>p.featured).slice(0,4);

  function logout(){
    setToken('');
    setUser(null);
    localStorage.removeItem('re_token');
    localStorage.removeItem('re_user');
    setPage('home');
    notify('You have been logged out.');
  }

  async function submitAuth(e){
    e.preventDefault();
    setBusy(true);
    try{
      const r=await fetch(`${API}/auth/${authMode}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(authForm)
      });
      const data=await r.json();
      if(!r.ok) throw Error(data.message||'Authentication failed.');
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('re_token',data.token);
      localStorage.setItem('re_user',JSON.stringify(data.user));
      setModal(null);
      setAuthForm({name:'',email:'',password:''});
      notify(`Welcome${data.user?.name ? `, ${data.user.name}` : ''}!`);
    }catch(err){
      notify(err.message);
    }finally{
      setBusy(false);
    }
  }

  function openBooking(product){
    if(!token){
      setAuthMode('login');
      setModal('auth');
      notify('Please log in to book a device.');
      return;
    }
    setSelected(product);
    setRental({startDate:today(),endDate:today()});
    setModal('booking');
  }

  async function createBooking(e){
    e.preventDefault();
    if(rental.endDate<rental.startDate){
      notify('End date must be on or after start date.');
      return;
    }
    setBusy(true);
    try{
      const r=await fetch(`${API}/bookings`,{method:'POST',headers,body:JSON.stringify({productId:selected._id,...rental})});
      const data=await r.json();
      if(!r.ok) throw Error(data.message);
      setModal(null);
      await loadBookings();
      setPage('rentals');
      notify('Your rental is confirmed!');
    }catch(err){
      notify(err.message||'Could not create rental.');
    }finally{
      setBusy(false);
    }
  }

  async function cancelBooking(id){
    try{
      const r=await fetch(`${API}/bookings/${id}/cancel`,{method:'PATCH',headers});
      const d=await r.json();
      if(!r.ok) throw Error(d.message);
      loadBookings();
      notify('Rental cancelled.');
    }catch(e){
      notify(e.message);
    }
  }

  const days=Math.max(1,Math.ceil((new Date(rental.endDate)-new Date(rental.startDate))/86400000)+1);

  function ProductCard({product}){
    return <article className="product-card">
      <button className="product-image" onClick={()=>{setSelected(product);setModal('detail')}} aria-label={`View ${product.name}`}>
        <img src={product.image} alt={product.name} loading="lazy"/>
        <span className="image-tag">{product.category}</span>
      </button>
      <div className="product-info">
        <div className="brand">{product.brand}</div>
        <h3>{product.name}</h3>
        <p className="muted clamp">{product.description}</p>
        <div className="product-bottom">
          <div><strong>{money(product.pricePerDay)}</strong><span className="per"> / day</span></div>
          <button className="icon-button add" onClick={()=>openBooking(product)} aria-label={`Rent ${product.name}`}><ArrowRight size={18}/></button>
        </div>
      </div>
    </article>;
  }

  return (
    <div className="app-shell">
      <div className="top-strip">Make room for more possibilities. <b>Rent smarter with RentEase.</b></div>
      <header className="navbar">
        <a className="logo" href="#" onClick={(e)=>{e.preventDefault();setPage('home');}}>
          <span className="logo-mark"><Package size={20}/></span>rent<span>ease</span>
        </a>
        <nav className={mobileNav?'nav-links open':'nav-links'}>
          <button onClick={()=>{setPage('home');setMobileNav(false)}} className={page==='home'?'active':''}>Home</button>
          <button onClick={()=>{setPage('catalog');setMobileNav(false)}} className={page==='catalog'?'active':''}>Explore devices</button>
          <button onClick={()=>{setPage('rentals');setMobileNav(false);if(!token){setModal('auth');setAuthMode('login')}}} className={page==='rentals'?'active':''}>My rentals</button>
        </nav>
        <div className="nav-actions">
          <button className="account-btn" onClick={()=>user?logout():(setAuthMode('login'),setModal('auth'))}>
            {user?<><LogOut size={17}/><span>Logout</span></>:<><UserRound size={17}/><span>Sign in</span></>}
          </button>
          <button className="mobile-menu" onClick={()=>setMobileNav(!mobileNav)}>{mobileNav?<X/>:<Menu/>}</button>
        </div>
      </header>

      {page==='home'&&<main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={14}/> THE SMARTER WAY TO ACCESS TECH</div>
            <h1>Good tech.<br/><em>Better living.</em></h1>
            <p>Get the devices you need, exactly when you need them. Premium electronics, flexible rentals, zero long-term commitment.</p>
            <div className="hero-actions">
              <button className="btn btn-dark" onClick={()=>setPage('catalog')}>Explore devices <ArrowRight size={17}/></button>
              <span className="hero-note"><ShieldCheck size={16}/> Simple. Secure. Flexible.</span>
            </div>
            <div className="hero-stats">
              <div><b>50+</b><span>Tech choices</span></div>
              <div><b>Easy</b><span>Monthly plans</span></div>
              <div><b>24/7</b><span>Support</span></div>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-orbit"></div>
            <div className="hero-glow"></div>
            <div className="hero-product laptop-art"><img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000" alt="Laptop"/></div>
            <div className="hero-product phone-art"><img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=700" alt="Smartphone"/></div>
            <div className="float-card"><span className="float-icon"><CalendarDays size={17}/></span><div><b>Your time, your terms</b><small>Flexible rental periods</small></div></div>
            <div className="art-caption">TECH THAT MOVES WITH YOU <span>✳</span></div>
          </div>
        </section>
        <section className="trust-row">
          <div><ShieldCheck/><span><b>Verified devices</b><small>Quality checked tech</small></span></div>
          <div><Truck/><span><b>At your doorstep</b><small>Convenient delivery</small></span></div>
          <div><Headphones/><span><b>Here to help</b><small>Friendly support</small></span></div>
          <div><CheckCircle2/><span><b>Flexible rentals</b><small>Plans that fit you</small></span></div>
        </section>
        <section className="section">
          <div className="section-heading">
            <div><div className="eyebrow">FIND YOUR NEXT FAVOURITE</div><h2>Explore by category</h2></div>
            <button className="text-link" onClick={()=>setPage('catalog')}>View all devices <ArrowRight size={16}/></button>
          </div>
          <div className="category-grid">
            {categories.slice(1).map((c,i)=>{
              const I=icons[c]||Watch;
              return <button className="category-tile" key={c} onClick={()=>{setCategory(c);setPage('catalog')}}>
                <span className={`category-icon tone-${i}`}><I size={24}/></span>
                <b>{c}</b>
                <span className="category-arrow"><ArrowRight size={16}/></span>
              </button>;
            })}
          </div>
        </section>
        <section className="section featured-section">
          <div className="section-heading">
            <div><div className="eyebrow">HANDPICKED FOR YOU</div><h2>Popular right now</h2><p className="muted">Great gear. A little more freedom.</p></div>
            <button className="text-link" onClick={()=>setPage('catalog')}>Browse everything <ArrowRight size={16}/></button>
          </div>
          <div className="product-grid">{featured.map(p=><ProductCard key={p._id} product={p}/>)}</div>
        </section>
        <section className="cta-banner">
          <div>
            <div className="eyebrow light">READY WHEN YOU ARE</div>
            <h2>More access.<br/>Less commitment.</h2>
            <p>Find the right device for your next big idea.</p>
            <button className="btn btn-light" onClick={()=>setPage('catalog')}>Find your device <ArrowRight size={17}/></button>
          </div>
          <div className="cta-shape">RE<span>✳</span></div>
        </section>
      </main>}

      {page==='catalog'&&<main className="page-main">
        <div className="page-title">
          <div className="eyebrow">THE RENT EASE COLLECTION</div>
          <h1>Find your <em>next device.</em></h1>
          <p className="muted">Explore our range of tech, ready when you are.</p>
        </div>
        <div className="catalog-tools">
          <div className="search-box">
            <Search size={18}/>
            <input placeholder="Search devices, brands..." value={query} onChange={e=>setQuery(e.target.value)}/>
          </div>
          <div className="filter-pills">
            {categories.map(c=><button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}
          </div>
        </div>
        <div className="result-line">
          <span>{filtered.length} devices available</span>
          <span>Prices shown per day</span>
        </div>
        <div className="product-grid">{filtered.map(p=><ProductCard key={p._id} product={p}/>)}</div>
        {!filtered.length&&<div className="empty-state"><Package size={38}/><h3>No devices found</h3><p>Try another search or category.</p></div>}
      </main>}

      {page==='rentals'&&<main className="page-main">
        <div className="page-title">
          <div className="eyebrow">YOUR RENTAL SPACE</div>
          <h1>My <em>rentals.</em></h1>
          <p className="muted">Keep track of the tech you have booked.</p>
        </div>
        {!token ? (
          <div className="empty-state">
            <UserRound size={38}/>
            <h3>Sign in to see your rentals</h3>
            <button className="btn btn-dark" onClick={()=>{setAuthMode('login');setModal('auth')}}>Sign in</button>
          </div>
        ) : bookings.length===0 ? (
          <div className="empty-state">
            <ShoppingBag size={38}/>
            <h3>No rentals yet</h3>
            <p>Your next favourite device is waiting.</p>
            <button className="btn btn-dark" onClick={()=>setPage('catalog')}>Explore devices</button>
          </div>
        ) : (
          <div className="booking-list">
            {bookings.map(b=>(
              <div className="booking-card" key={b._id}>
                <img src={b.product?.image} alt=""/>
                <div className="booking-detail">
                  <b>{b.product?.name||'Device'}</b>
                  <span>{new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()} · {b.days} day(s)</span>
                  <strong>{money(b.totalPrice)}</strong>
                </div>
                <div className="booking-status">
                  <span className={`status ${(b.status||'Confirmed').toLowerCase()}`}>{b.status}</span>
                  {b.status!=='Cancelled'&&<button className="cancel-link" onClick={()=>cancelBooking(b._id)}>Cancel rental</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>}

      <footer>
        <div className="footer-main">
          <a className="logo footer-logo" href="#" onClick={(e)=>{e.preventDefault();setPage('home');}}>
            <span className="logo-mark"><Package size={20}/></span>rent<span>ease</span>
          </a>
          <p>Technology that fits your life, not the other way around.</p>
          <div className="footer-links">
            <button onClick={()=>setPage('catalog')}>Browse devices</button>
            <button onClick={()=>{setPage('rentals');if(!token)setModal('auth')}}>My rentals</button>
            <a href="mailto:hello@rentease.example">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 RentEase. College project demo.</span>
          <span>Rent what you need. Keep what matters.</span>
        </div>
      </footer>

      {toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}

      {modal==='auth'&&<div className="modal-backdrop" onClick={()=>setModal(null)}>
        <div className="modal auth-modal" onClick={e=>e.stopPropagation()}>
          <button className="modal-close" onClick={()=>setModal(null)}><X/></button>
          <div className="eyebrow">WELCOME TO RENTEASE</div>
          <h2>{authMode==='login'?'Good to see you.':'Create your account.'}</h2>
          <p className="muted">{authMode==='login'?'Sign in to manage your rentals.':'A world of tech is just a few clicks away.'}</p>
          <form onSubmit={submitAuth}>
            {authMode==='register'&&<label>Your name<input required value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Enter your name"/></label>}
            <label>Email address<input type="email" required value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com"/></label>
            <label>Password<input type="password" minLength="6" required value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder="At least 6 characters"/></label>
            <button className="btn btn-dark full" disabled={busy}>{busy?'Please wait...':authMode==='login'?'Sign in':'Create account'} <ArrowRight size={17}/></button>
          </form>
          <p className="switch-auth">
            {authMode==='login'?"New to RentEase?":"Already have an account?"} <button onClick={()=>setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?'Create an account':'Sign in'}</button>
          </p>
          <div className="demo-hint">Demo: demo@rentease.com / password123</div>
        </div>
      </div>}

      {modal==='detail'&&selected&&<div className="modal-backdrop" onClick={()=>setModal(null)}>
        <div className="modal detail-modal" onClick={e=>e.stopPropagation()}>
          <button className="modal-close" onClick={()=>setModal(null)}><X/></button>
          <img className="detail-image" src={selected.image} alt={selected.name}/>
          <div className="detail-content">
            <div className="eyebrow">{selected.brand} · {selected.category}</div>
            <h2>{selected.name}</h2>
            <p className="muted">{selected.description}</p>
            <div className="detail-price"><b>{money(selected.pricePerDay)}</b> / day</div>
            <p className="muted">Refundable security deposit: {money(selected.deposit||0)}</p>
            <button className="btn btn-dark full" onClick={()=>openBooking(selected)}>Rent this device <ArrowRight size={17}/></button>
          </div>
        </div>
      </div>}

      {modal==='booking'&&selected&&<div className="modal-backdrop" onClick={()=>setModal(null)}>
        <div className="modal booking-modal" onClick={e=>e.stopPropagation()}>
          <button className="modal-close" onClick={()=>setModal(null)}><X/></button>
          <div className="eyebrow">MAKE IT YOURS</div>
          <h2>Book your device.</h2>
          <p className="muted">{selected.name} · {money(selected.pricePerDay)} per day</p>
          <form onSubmit={createBooking}>
            <div className="date-fields">
              <label>Start date<input type="date" min={today()} required value={rental.startDate} onChange={e=>setRental({...rental,startDate:e.target.value})}/></label>
              <label>End date<input type="date" min={rental.startDate} required value={rental.endDate} onChange={e=>setRental({...rental,endDate:e.target.value})}/></label>
            </div>
            <div className="price-summary">
              <div><span>Rental duration</span><b>{days} day(s)</b></div>
              <div><span>Rental total</span><b>{money(days*selected.pricePerDay)}</b></div>
              <small>Payment is not collected in this demo. Security deposit, if any, is handled separately.</small>
            </div>
            <button className="btn btn-dark full" disabled={busy}>{busy?'Confirming...':'Confirm rental'} <ArrowRight size={17}/></button>
          </form>
        </div>
      </div>}
    </div>
  );
}

export default App;

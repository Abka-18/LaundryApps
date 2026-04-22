(() => {
  const STORAGE_KEY = "laundaps.state.v1";
  const SPLASH_KEY = "laundaps.splash.seen.v1";

  const statusFlow = [
    { id: "created", label: "Order dibuat", client: "Order diterima", tone: "info" },
    { id: "received", label: "Diterima", client: "Order diterima", tone: "info" },
    { id: "weighed", label: "Ditimbang", client: "Order dicek", tone: "info" },
    { id: "washing", label: "Dicuci", client: "Sedang dicuci", tone: "info" },
    { id: "drying", label: "Dikeringkan", client: "Sedang dicuci", tone: "info" },
    { id: "ironing", label: "Disetrika", client: "Sedang dirapikan", tone: "warning" },
    { id: "packing", label: "Dikemas", client: "Sedang dirapikan", tone: "warning" },
    { id: "ready", label: "Siap diambil", client: "Siap diambil", tone: "success" },
    { id: "out_for_delivery", label: "Sedang dikirim", client: "Dalam pengiriman", tone: "warning" },
    { id: "completed", label: "Selesai", client: "Selesai", tone: "success" }
  ];

  const ownerTabs = [
    { id: "dashboard", label: "Home", short: "Hm" },
    { id: "orders", label: "Order", short: "Or" },
    { id: "customers", label: "Pelanggan", short: "Pg" },
    { id: "reports", label: "Laporan", short: "Lp" },
    { id: "settings", label: "Atur", short: "At" }
  ];

  const clientTabs = [
    { id: "home",    label: "Home",    icon: "home" },
    { id: "create",  label: "Order",   icon: "plus" },
    { id: "track",   label: "Lacak",   icon: "pin" },
    { id: "report",  label: "Laporan", icon: "chart" },
    { id: "profile", label: "Profil",  icon: "user" }
  ];

  const clientNavTabs = new Set(clientTabs.map((t) => t.id));

  const paymentMethods = [
    { id: "gopay", name: "GoPay",              tag: "E-Wallet", sub: "Saldo Rp 250.000",        icon: "wallet" },
    { id: "ovo",   name: "OVO",                tag: "E-Wallet", sub: "Saldo Rp 120.000",        icon: "wallet" },
    { id: "bca",   name: "BCA Virtual Account",tag: "Bank",     sub: "Transfer via ATM / mobile",icon: "credit" },
    { id: "cash",  name: "Bayar saat ambil",   tag: "Cash",     sub: "Tunai di outlet",         icon: "cash" }
  ];

  const serviceIconMap = {
    "svc-kiloan":   "hanger",
    "svc-express":  "sparkle",
    "svc-setrika":  "iron",
    "svc-satuan":   "bag",
    "svc-bedcover": "bag"
  };

  const ui = {
    role: "owner",
    ownerTab: "dashboard",
    clientTab: "home",
    orderFilter: "all",
    search: "",
    trackingSearch: "",
    trackedOrderId: "",
    selectedClientId: "",
    reportRange: "today",
    modal: null,
    // client redesign state
    showSplash: false,
    historyFilter: "all",
    clientReportRange: "month",
    paymentOrderId: "",
    paymentMethodId: "gopay",
    createForm: null
  };

  let data = loadState();
  if (!data) {
    data = seedData();
    saveState();
  }
  ui.selectedClientId = data.customers[0]?.id || "";
  ui.createForm = createInitialCreateForm();
  try {
    ui.showSplash = !localStorage.getItem(SPLASH_KEY);
  } catch {
    ui.showSplash = false;
  }
  if (ui.showSplash) ui.role = "client";
  initRouteFromUrl();

  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modal-root");
  const toastRoot = document.getElementById("toast-root");

  render();
  registerServiceWorker();

  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("input", handleInput);
  document.addEventListener("change", handleChange);

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function seedData() {
    const now = new Date();
    const services = [
      { id: "svc-kiloan", name: "Cuci Setrika Kiloan", unit: "kg", price: 8000, etaHours: 36 },
      { id: "svc-express", name: "Express 6 Jam", unit: "kg", price: 15000, etaHours: 6 },
      { id: "svc-setrika", name: "Setrika Saja", unit: "kg", price: 6000, etaHours: 24 },
      { id: "svc-satuan", name: "Satuan Premium", unit: "pcs", price: 18000, etaHours: 48 },
      { id: "svc-bedcover", name: "Bedcover", unit: "pcs", price: 35000, etaHours: 72 }
    ];

    const customers = [
      {
        id: "cus-1",
        name: "Rani Wijaya",
        phone: "081234567890",
        address: "Jl. Melati 18, Bandung",
        points: 120
      },
      {
        id: "cus-2",
        name: "Dimas Pratama",
        phone: "081388776655",
        address: "Apartemen Taman Kota Tower B",
        points: 60
      },
      {
        id: "cus-3",
        name: "Maya Lestari",
        phone: "082112340099",
        address: "Jl. Cempaka Raya 7",
        points: 240
      }
    ];

    const orderSeed = [
      {
        customerId: "cus-1",
        serviceId: "svc-kiloan",
        qty: 4.5,
        fulfillment: "pickup",
        paymentStatus: "paid",
        paymentMethod: "QRIS",
        status: "washing",
        notes: "Parfum soft, ada noda saus di kemeja putih.",
        createdAt: addHours(now, -4),
        dueAt: addHours(now, 32)
      },
      {
        customerId: "cus-2",
        serviceId: "svc-express",
        qty: 3,
        fulfillment: "store",
        paymentStatus: "unpaid",
        paymentMethod: "Bayar nanti",
        status: "ready",
        notes: "Express, pelanggan ambil sore.",
        createdAt: addHours(now, -7),
        dueAt: addHours(now, -1)
      },
      {
        customerId: "cus-3",
        serviceId: "svc-satuan",
        qty: 5,
        fulfillment: "delivery",
        paymentStatus: "paid",
        paymentMethod: "Transfer",
        status: "out_for_delivery",
        notes: "Antar ke resepsionis jika pelanggan belum pulang.",
        createdAt: addHours(now, -18),
        dueAt: addHours(now, 1)
      },
      {
        customerId: "cus-1",
        serviceId: "svc-setrika",
        qty: 6,
        fulfillment: "store",
        paymentStatus: "paid",
        paymentMethod: "Tunai",
        status: "completed",
        notes: "Lipat rapi tanpa hanger.",
        createdAt: addDays(now, -2),
        dueAt: addDays(now, -1)
      },
      {
        customerId: "cus-2",
        serviceId: "svc-bedcover",
        qty: 2,
        fulfillment: "pickup",
        paymentStatus: "unpaid",
        paymentMethod: "Bayar nanti",
        status: "weighed",
        notes: "Pickup dari lobby, bedcover ukuran king.",
        createdAt: addDays(now, -1),
        dueAt: addHours(now, 38)
      }
    ];

    const orders = orderSeed.map((seed, index) => buildOrder(seed, services, customers, index + 1));

    return {
      outlet: {
        name: "LaundAps Clean",
        city: "Bandung",
        phone: "081234000111",
        address: "Jl. Suka Bersih No. 12"
      },
      services,
      customers,
      orders,
      sequence: orders.length + 1
    };
  }

  function buildOrder(seed, services, customers, sequence) {
    const service = services.find((item) => item.id === seed.serviceId);
    const customer = customers.find((item) => item.id === seed.customerId);
    const deliveryFee = seed.fulfillment === "delivery" ? 10000 : seed.fulfillment === "pickup" ? 5000 : 0;
    const subtotal = Math.round((seed.qty || 1) * service.price);
    return {
      id: createId("ord"),
      number: makeOrderNumber(sequence, seed.createdAt),
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      serviceId: service.id,
      serviceName: service.name,
      unit: service.unit,
      qty: seed.qty,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      fulfillment: seed.fulfillment,
      paymentStatus: seed.paymentStatus,
      paymentMethod: seed.paymentMethod,
      status: seed.status,
      notes: seed.notes || "",
      createdAt: seed.createdAt.toISOString(),
      dueAt: seed.dueAt.toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function render() {
    if (ui.showSplash) {
      app.innerHTML = renderSplashScreen();
      modalRoot.innerHTML = "";
      return;
    }

    if (ui.role === "client") {
      app.innerHTML = `
        <main class="c-app">
          ${renderClientApp()}
        </main>
        ${renderClientBottomNav()}
      `;
    } else {
      app.innerHTML = `
        <main class="mobile-frame">
          ${renderTopbar()}
          ${renderOwnerApp()}
        </main>
        ${renderBottomNav()}
        <button class="fab" type="button" data-action="open-order-form">+ Order</button>
      `;
    }
    modalRoot.innerHTML = ui.modal ? renderModal(ui.modal) : "";
  }

  function renderTopbar() {
    const roleLabel = ui.role === "owner" ? "Owner & Staff" : "Pelanggan";
    return `
      <header class="topbar">
        <div class="brand-row">
          <img class="brand-mark" src="assets/laundry-basket.svg" alt="LaundAps" />
          <div class="brand-copy">
            <p class="eyebrow">${roleLabel}</p>
            <h1>${escapeHtml(data.outlet.name)}</h1>
          </div>
          <div class="role-switch" aria-label="Pilih mode aplikasi">
            <button class="${ui.role === "owner" ? "active" : ""}" type="button" data-action="set-role" data-role="owner">Bisnis</button>
            <button class="${ui.role === "client" ? "active" : ""}" type="button" data-action="set-role" data-role="client">Client</button>
          </div>
        </div>
      </header>
    `;
  }

  function renderOwnerApp() {
    if (ui.ownerTab === "orders") return renderOrdersPage();
    if (ui.ownerTab === "customers") return renderCustomersPage();
    if (ui.ownerTab === "reports") return renderReportsPage();
    if (ui.ownerTab === "settings") return renderSettingsPage();
    return renderDashboardPage();
  }

  function renderClientApp() {
    if (ui.clientTab === "create")  return renderClientCreatePage();
    if (ui.clientTab === "track")   return renderClientTrackingPage();
    if (ui.clientTab === "history") return renderClientHistoryPage();
    if (ui.clientTab === "report")  return renderClientReportPage();
    if (ui.clientTab === "payment") return renderClientPaymentPage();
    if (ui.clientTab === "profile") return renderClientProfilePage();
    return renderClientHomePage();
  }

  function renderBottomNav() {
    const tabs = ui.role === "owner" ? ownerTabs : clientTabs;
    const activeTab = ui.role === "owner" ? ui.ownerTab : ui.clientTab;
    return `
      <nav class="bottom-nav" aria-label="Navigasi utama">
        <div class="bottom-nav-inner">
          ${tabs
            .map(
              (tab) => `
                <button class="nav-item ${activeTab === tab.id ? "active" : ""}" type="button" data-action="set-tab" data-tab="${tab.id}">
                  <span>${tab.short}</span>${tab.label}
                </button>
              `
            )
            .join("")}
        </div>
      </nav>
    `;
  }

  function renderDashboardPage() {
    const metrics = getDashboardMetrics();
    const focusOrders = data.orders
      .filter((order) => order.status !== "completed")
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))
      .slice(0, 4);

    return `
      <section class="page-title">
        <div>
          <h2>Operasional hari ini</h2>
          <p>${formatDate(new Date())} - pantau order, omzet, dan cucian siap ambil.</p>
        </div>
      </section>

      <section class="dashboard-grid" aria-label="Ringkasan bisnis">
        ${statCard("Order hari ini", metrics.todayOrders, "Masuk sejak buka toko", "primary")}
        ${statCard("Omzet hari ini", formatCurrency(metrics.todayRevenue), "Transaksi sudah lunas")}
        ${statCard("Diproses", metrics.inProcess, "Cuci, kering, setrika")}
        ${statCard("Belum diambil", metrics.unclaimed, "Perlu reminder", metrics.unclaimed ? "warning" : "")}
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Aksi cepat</h3>
            <p>Dirancang untuk kasir saat outlet ramai.</p>
          </div>
        </div>
        <div class="quick-actions">
          <button class="quick-action" type="button" data-action="open-order-form">Order Baru<span>Input cepat</span></button>
          <button class="quick-action" type="button" data-action="set-tab" data-tab="orders">Update Status<span>Satu tap</span></button>
          <button class="quick-action" type="button" data-action="copy-daily-summary">Kirim Rekap<span>Owner</span></button>
        </div>
      </section>

      <div class="content-layout">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h3>Prioritas sekarang</h3>
              <p>Urut dari deadline paling dekat.</p>
            </div>
            <button class="ghost-button" type="button" data-action="set-tab" data-tab="orders">Lihat semua</button>
          </div>
          ${focusOrders.length ? `<div class="order-list">${focusOrders.map(renderOrderCard).join("")}</div>` : renderEmpty("Tidak ada order aktif.")}
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h3>Insight cepat</h3>
              <p>Data yang membantu keputusan harian.</p>
            </div>
          </div>
          <div class="insight-list">
            ${renderInsight("Pickup & delivery", `${metrics.deliveryActive} aktif`, "Jadwal jemput dan antar hari ini")}
            ${renderInsight("Pelanggan aktif", metrics.activeCustomers, "Pelanggan dengan order 30 hari terakhir")}
            ${renderInsight("Layanan terlaris", metrics.topService || "-", "Berdasarkan order bulan ini")}
            ${renderInsight("Omzet bulan ini", formatCurrency(metrics.monthRevenue), "Transaksi lunas bulan berjalan")}
          </div>
        </section>
      </div>
    `;
  }

  function renderOrdersPage() {
    const filtered = getFilteredOrders();
    return `
      <section class="page-title">
        <div>
          <h2>Order laundry</h2>
          <p>Cari, filter, update status, dan kirim info ke pelanggan.</p>
        </div>
      </section>
      <div class="search-row">
        <input class="input" type="search" placeholder="Cari nama, invoice, nomor HP" value="${escapeAttr(ui.search)}" data-input="search-orders" />
        <button class="button" type="button" data-action="open-order-form">+ Order</button>
      </div>
      ${renderOrderFilters()}
      <section class="order-list">
        ${filtered.length ? filtered.map(renderOrderCard).join("") : renderEmpty("Order tidak ditemukan.")}
      </section>
    `;
  }

  function renderCustomersPage() {
    const customers = data.customers
      .map((customer) => {
        const orders = data.orders.filter((order) => order.customerId === customer.id);
        const spent = orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.total, 0);
        return { ...customer, orders: orders.length, spent };
      })
      .sort((a, b) => b.orders - a.orders);

    return `
      <section class="page-title">
        <div>
          <h2>Pelanggan</h2>
          <p>Riwayat pelanggan untuk repeat order, promo, dan reminder.</p>
        </div>
      </section>
      <section class="customer-list">
        ${customers
          .map(
            (customer) => `
              <article class="customer-row">
                <div class="avatar">${initials(customer.name)}</div>
                <div class="row-copy">
                  <strong>${escapeHtml(customer.name)}</strong>
                  <span>${escapeHtml(customer.phone)} - ${customer.orders} order - ${formatCurrency(customer.spent)}</span>
                </div>
                <button class="ghost-button" type="button" data-action="open-customer" data-id="${customer.id}">Detail</button>
              </article>
            `
          )
          .join("")}
      </section>
    `;
  }

  function renderReportsPage() {
    const report = getReport(ui.reportRange);
    const maxService = Math.max(1, ...report.services.map((item) => item.total));
    return `
      <section class="page-title">
        <div>
          <h2>Laporan</h2>
          <p>Ringkas dulu, detail bisa dikembangkan setelah validasi outlet.</p>
        </div>
      </section>
      <div class="segmented" role="tablist" aria-label="Rentang laporan">
        ${["today", "week", "month"]
          .map(
            (range) => `
              <button class="${ui.reportRange === range ? "active" : ""}" type="button" data-action="set-report-range" data-range="${range}">
                ${rangeLabel(range)}
              </button>
            `
          )
          .join("")}
      </div>
      <section class="dashboard-grid">
        ${statCard("Omzet", formatCurrency(report.revenue), "Transaksi lunas", "primary")}
        ${statCard("Order", report.orders, "Total order dibuat")}
        ${statCard("Belum lunas", formatCurrency(report.unpaid), "Perlu ditagih")}
        ${statCard("Rata-rata", formatCurrency(report.average), "Nilai per order")}
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Layanan terlaris</h3>
            <p>Bantu atur promo dan kapasitas produksi.</p>
          </div>
        </div>
        <div class="report-bars">
          ${report.services
            .map(
              (item) => `
                <div class="bar-row">
                  <div class="bar-label"><strong>${escapeHtml(item.name)}</strong><span>${item.count} order</span></div>
                  <div class="bar-track"><div class="bar-fill" style="width: ${Math.max(8, (item.total / maxService) * 100)}%"></div></div>
                </div>
              `
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderSettingsPage() {
    return `
      <section class="page-title">
        <div>
          <h2>Pengaturan bisnis</h2>
          <p>Harga layanan, outlet, notifikasi, dan reset demo.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Outlet</h3>
            <p>${escapeHtml(data.outlet.address)}, ${escapeHtml(data.outlet.city)}</p>
          </div>
        </div>
        <div class="insight-list">
          ${renderInsight("Nomor WhatsApp", data.outlet.phone, "Dipakai untuk notifikasi pelanggan")}
          ${renderInsight("Mode app", "PWA mobile-first", "Bisa diinstall dari browser smartphone")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Layanan & harga</h3>
            <p>Harga awal untuk validasi laundry kecil-menengah.</p>
          </div>
        </div>
        <div class="service-list">
          ${data.services
            .map(
              (service) => `
                <article class="service-row">
                  <div>
                    <strong>${escapeHtml(service.name)}</strong>
                    <span>${formatCurrency(service.price)} / ${service.unit} - estimasi ${service.etaHours} jam</span>
                  </div>
                  <button class="ghost-button" type="button" data-action="edit-service" data-id="${service.id}">Edit</button>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Data demo</h3>
            <p>Gunakan saat ingin mengulang skenario dari awal.</p>
          </div>
        </div>
        <button class="danger-button" type="button" data-action="reset-demo">Reset data demo</button>
      </section>
    `;
  }

  function renderClientHomePage() {
    const customer = getSelectedClient();
    const allOrders = getClientOrders(customer.id);
    const activeOrders = allOrders.filter((order) => order.status !== "completed");
    const activeOrder = activeOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    const lastCompleted = allOrders.filter((o) => o.status === "completed").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    const greet = greetingFor(new Date());
    const badge = activeOrders.length;

    return `
      <section class="c-page">
        <div class="c-greet">
          <div class="c-avatar">${escapeHtml(initials(customer.name))}</div>
          <div class="c-greet__copy">
            <p>${escapeHtml(greet)} 👋</p>
            <h2>Halo, ${escapeHtml(firstName(customer.name))}</h2>
          </div>
          <button class="c-icon-btn c-bell" type="button" data-action="open-client-history" aria-label="Notifikasi">
            ${icon("bell")}
            ${badge ? `<span class="c-bell__badge">${badge}</span>` : ""}
          </button>
        </div>

        ${activeOrder ? renderClientActiveHero(activeOrder) : renderClientEmptyHero(customer)}

        <div class="c-quick-grid">
          <button class="c-quick-tile" type="button" data-action="go-tab" data-tab="create">
            <span class="c-quick-tile__icon">${icon("plus")}</span>
            <span class="c-quick-tile__label">Order\nBaru</span>
          </button>
          <button class="c-quick-tile" type="button" data-action="go-tab" data-tab="track">
            <span class="c-quick-tile__icon c-quick-tile__icon--info">${icon("pin")}</span>
            <span class="c-quick-tile__label">Lacak</span>
          </button>
          <button class="c-quick-tile" type="button" data-action="go-tab" data-tab="history">
            <span class="c-quick-tile__icon c-quick-tile__icon--warning">${icon("clock")}</span>
            <span class="c-quick-tile__label">Riwayat</span>
          </button>
          <button class="c-quick-tile" type="button" data-action="open-promo">
            <span class="c-quick-tile__icon c-quick-tile__icon--accent">${icon("gift")}</span>
            <span class="c-quick-tile__label">Promo</span>
          </button>
        </div>

        <button class="c-promo" type="button" data-action="open-promo">
          <span class="c-promo__icon">${icon("gift")}</span>
          <div class="c-promo__body">
            <h4>Diskon 25% hari ini!</h4>
            <p>Cuci kering minimal 3 kg</p>
          </div>
          <span class="c-promo__chev">${icon("chev")}</span>
        </button>

        <div class="c-section-head">
          <h3>Aktivitas terbaru</h3>
          <button class="c-link" type="button" data-action="go-tab" data-tab="history">Lihat semua</button>
        </div>
        ${lastCompleted ? renderClientActivityRow(lastCompleted) : `
          <div class="c-card c-empty">
            <div class="c-empty__illust"><span class="p1"></span><span class="p2"></span><span class="p3"></span><span class="p4"></span></div>
            <strong>Belum ada riwayat</strong>
            <p>Order pertamamu akan muncul di sini setelah selesai.</p>
          </div>
        `}
      </section>
    `;
  }

  function renderClientActiveHero(order) {
    const progress = clientProgressIndex(order.status); // 0..4
    const step = clientProgressSteps[Math.min(progress, 4)];
    return `
      <section class="c-hero" aria-label="Order aktif">
        <div class="c-hero__row">
          <div>
            <p class="c-hero__eyebrow">ORDER AKTIF</p>
            <h3 class="c-hero__title">${escapeHtml(step.heroTitle)}</h3>
          </div>
          <span class="c-pill c-pill--warning">${escapeHtml(getStatus(order.status).client)}</span>
        </div>
        <div class="c-hero-progress" aria-label="Progres ${progress + 1} dari 5">
          ${[0,1,2,3,4].map((i) => `<span class="${i < progress ? "is-done" : i === progress ? "is-current" : ""}"></span>`).join("")}
        </div>
        <div class="c-hero__footer">
          <div>
            <p>Estimasi selesai</p>
            <strong>${escapeHtml(formatShortDate(order.dueAt))}</strong>
          </div>
          <button class="c-hero__cta" type="button" data-action="track-order" data-id="${order.id}">
            Lacak ${icon("chev", "#fff")}
          </button>
        </div>
      </section>
    `;
  }

  function renderClientEmptyHero(customer) {
    return `
      <section class="c-hero" aria-label="Belum ada order aktif">
        <div class="c-hero__row">
          <div>
            <p class="c-hero__eyebrow">PELANGGAN ${customer.points ? "· " + customer.points + " POIN" : ""}</p>
            <h3 class="c-hero__title">Laundry kamu,<br/>jelas statusnya.</h3>
          </div>
          <span class="c-pill c-pill--glass">Siap order</span>
        </div>
        <div class="c-hero__footer" style="margin-top:18px;">
          <div>
            <p>Pickup gratis</p>
            <strong>Min. 3 kg</strong>
          </div>
          <button class="c-hero__cta" type="button" data-action="go-tab" data-tab="create">
            Pesan ${icon("chev", "#fff")}
          </button>
        </div>
      </section>
    `;
  }

  function renderClientActivityRow(order) {
    const rating = 5;
    return `
      <div class="c-card c-card--pad14">
        <div class="c-activity-row">
          <span class="c-activity-row__icon">${icon("check")}</span>
          <div class="c-activity-row__copy">
            <strong>Order ${escapeHtml(order.number)}</strong>
            <span>Selesai · ${escapeHtml(formatShortDate(order.updatedAt))} · ${escapeHtml(formatCurrency(order.total))}</span>
          </div>
          <span class="c-stars" aria-label="Rating ${rating} bintang">
            ${Array.from({ length: rating }, () => icon("star-solid")).join("")}
          </span>
        </div>
      </div>
    `;
  }

  function renderClientCreatePage() {
    const customer = getSelectedClient();
    const form = ui.createForm;
    const service = data.services.find((s) => s.id === form.serviceId) || data.services[0];
    const qty = form.qty || (service.unit === "kg" ? 4 : 1);
    const subtotal = Math.round(qty * service.price);
    const fee = 5000;
    const total = subtotal + fee;

    return `
      <section class="c-page">
        <div class="c-page-head">
          <button class="c-icon-btn" type="button" data-action="go-tab" data-tab="home" aria-label="Kembali">
            ${icon("chevLeft")}
          </button>
          <div class="c-page-head__title">
            <h1>Buat order</h1>
            <p>Pilih layanan, jadwal, &amp; alamat</p>
          </div>
        </div>

        <h3 class="c-section-label">Pilih layanan</h3>
        <div class="c-service-grid">
          ${data.services.map((svc) => renderServiceTile(svc, svc.id === form.serviceId)).join("")}
        </div>

        <h3 class="c-section-label">Jadwal jemput</h3>
        <div class="c-chip-row">
          ${buildDateChips(form.date).map((c) => `
            <button class="c-date-chip ${c.active ? "is-active" : ""}" type="button" data-action="set-create-date" data-date="${c.key}">
              <small>${escapeHtml(c.label)}</small>
              <strong>${escapeHtml(c.date)}</strong>
            </button>
          `).join("")}
        </div>
        <div class="c-chip-row c-chip-row--time">
          ${["09:00", "12:00", "15:00", "18:00"].map((t) => `
            <button class="c-time-chip ${form.time === t ? "is-active" : ""}" type="button" data-action="set-create-time" data-time="${t}">${t}</button>
          `).join("")}
        </div>

        <h3 class="c-section-label">Alamat jemput</h3>
        <div class="c-card c-card--pad14" style="margin-bottom: 20px;">
          <div class="c-row" style="padding:0;">
            <span class="c-row__icon">${icon("pin")}</span>
            <div class="c-row__copy">
              <strong>Rumah</strong>
              <span>${escapeHtml(customer.address || "Alamat belum diatur")}</span>
            </div>
            <button class="c-row__action" type="button" data-action="edit-address">Ubah</button>
          </div>
        </div>
      </section>

      <div class="c-sticky-cta">
        <div class="c-sticky-cta__row">
          <div class="c-sticky-cta__price">
            <p>Estimasi biaya</p>
            <strong>${escapeHtml(formatCurrency(total))}</strong>
          </div>
          <span class="c-pill c-pill--primary">~${qty}${service.unit} · ${escapeHtml(service.name)}</span>
        </div>
        <button class="c-btn c-btn--accent c-btn--full" type="button" data-action="confirm-client-order">Pesan Sekarang</button>
      </div>
    `;
  }

  function renderServiceTile(service, active) {
    const iconName = serviceIconMap[service.id] || "bag";
    const priceLabel = `Rp ${Math.round(service.price / 1000)}k`;
    return `
      <button class="c-service-tile ${active ? "is-active" : ""}" type="button" data-action="set-create-service" data-service="${service.id}">
        <span class="c-service-tile__icon">${icon(iconName)}</span>
        <span class="c-service-tile__name">${escapeHtml(service.name)}</span>
        <span class="c-service-tile__price">${priceLabel}<small>/${service.unit}</small></span>
        <span class="c-service-tile__check">${icon("check", "#fff", 3)}</span>
      </button>
    `;
  }

  function renderClientTrackingPage() {
    const customer = getSelectedClient();
    const active = getClientOrders(customer.id).filter((o) => o.status !== "completed");
    const tracked = ui.trackedOrderId ? getOrder(ui.trackedOrderId) : null;
    const target = tracked || active[0] || getClientOrders(customer.id)[0];

    return `
      <section class="c-page">
        <div class="c-page-head">
          <button class="c-icon-btn" type="button" data-action="go-tab" data-tab="home" aria-label="Kembali">${icon("chevLeft")}</button>
          <div class="c-page-head__title">
            <h1>Lacak order</h1>
            <p>${target ? escapeHtml(target.number) : "Cari invoice kamu"}</p>
          </div>
          <button class="c-icon-btn" type="button" data-action="tracking-info" aria-label="Info">${icon("note")}</button>
        </div>

        <form id="tracking-lookup-form" style="display:flex; gap:8px; margin-bottom:16px;">
          <input class="input" name="query" type="search" placeholder="Nomor invoice, contoh LA-0420-001" value="${escapeAttr(ui.trackingSearch)}"
                 style="flex:1; height:44px; padding: 0 14px; border:1.5px solid var(--c-line-soft); border-radius:12px; background:#fff; font:500 14px/1 Inter,sans-serif;" />
          <button class="c-btn c-btn--primary" type="submit" style="height:44px;">Cari</button>
        </form>

        ${target ? renderClientTrackingDetail(target) : `
          <div class="c-card c-empty">
            <div class="c-empty__illust"><span class="p1"></span><span class="p2"></span><span class="p3"></span><span class="p4"></span></div>
            <strong>Belum ada order untuk dilacak</strong>
            <p>Buat order laundry dan pantau prosesnya di sini.</p>
            <button class="c-btn c-btn--primary" type="button" data-action="go-tab" data-tab="create" style="margin-top:8px;">Buat order</button>
          </div>
        `}
      </section>
    `;
  }

  function renderClientHistoryPage() {
    const customer = getSelectedClient();
    const filters = [
      ["all", "Semua"],
      ["process", "Diproses"],
      ["done", "Selesai"],
      ["cancel", "Dibatalkan"]
    ];
    const filter = ui.historyFilter;
    const orders = getClientOrders(customer.id)
      .filter((o) => {
        if (filter === "process") return !["ready", "completed"].includes(o.status);
        if (filter === "done") return o.status === "completed";
        if (filter === "cancel") return o.paymentStatus === "cancelled";
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return `
      <section class="c-page">
        <h1 class="c-page-title">Riwayat</h1>
        <p class="c-page-subtitle">Semua order kamu di satu tempat</p>

        <div class="c-filter-row" role="tablist" aria-label="Filter riwayat">
          ${filters.map(([id, label]) => `
            <button class="c-filter-chip ${filter === id ? "is-active" : ""}" type="button" data-action="set-history-filter" data-filter="${id}">${label}</button>
          `).join("")}
        </div>

        ${orders.length ? `<div class="c-history-list">${orders.map(renderClientHistoryCard).join("")}</div>` : `
          <div class="c-card c-empty">
            <div class="c-empty__illust"><span class="p1"></span><span class="p2"></span><span class="p3"></span><span class="p4"></span></div>
            <strong>Belum ada order</strong>
            <p>Yuk pesan laundry pertamamu. Jemput &amp; antar gratis untuk order di atas 3kg.</p>
            <button class="c-btn c-btn--primary" type="button" data-action="go-tab" data-tab="create" style="margin-top:8px;">Buat Order Pertama</button>
          </div>
        `}
      </section>
    `;
  }

  function renderClientHistoryCard(order) {
    const tone = historyTone(order);
    const label = historyLabel(order);
    const rating = order.status === "completed" ? 5 : 0;
    return `
      <div class="c-card c-card--pad14">
        <div class="c-history-card__top">
          <div class="c-history-card__id">
            <strong>${escapeHtml(order.number)}</strong>
            <span>${escapeHtml(order.serviceName)} · ${formatQty(order)}</span>
          </div>
          <span class="c-pill c-pill--${tone} c-pill--sm">${escapeHtml(label)}</span>
        </div>
        <div class="c-history-card__bottom">
          <div class="c-history-card__meta">
            <span>${escapeHtml(formatHistoryDate(order.createdAt))}</span>
            <strong>${escapeHtml(formatCurrency(order.total))}</strong>
          </div>
          ${rating ? `<span class="c-stars">${Array.from({length: rating}, () => icon("star-solid")).join("")}</span>` : `
            <button class="c-link" type="button" data-action="open-client-order" data-id="${order.id}">Detail ›</button>
          `}
        </div>
      </div>
    `;
  }

  function renderClientProfilePage() {
    const customer = getSelectedClient();
    const totalOrders = getClientOrders(customer.id).length;
    const tier = customer.points >= 100 ? "GOLD" : customer.points >= 50 ? "SILVER" : "REGULAR";

    const group1 = [
      { icon: "user",   label: "Data pribadi",        sub: `${firstName(customer.name)}, ${customer.phone}`, action: "profile-personal" },
      { icon: "pin",    label: "Alamat tersimpan",    sub: customer.address || "Belum ada",                   action: "profile-address" },
      { icon: "credit", label: "Metode pembayaran",   sub: "GoPay, BCA, Cash",                                action: "profile-payment" }
    ];
    const group2 = [
      { icon: "bell",   label: "Notifikasi",          sub: "Push & WA",                                       action: "profile-notif" },
      { icon: "gift",   label: "Voucher & poin",      sub: `${customer.points} poin`, badge: "Baru",          action: "profile-voucher" },
      { icon: "help",   label: "Bantuan",             sub: "FAQ & kontak",                                    action: "profile-help" }
    ];
    const group3 = [
      { icon: "home",   label: "Beralih ke mode bisnis", sub: "Untuk owner & staff", action: "switch-to-owner" },
      ...data.customers.filter((c) => c.id !== customer.id).slice(0, 2).map((c) => ({
        icon: "user", label: `Masuk sebagai ${firstName(c.name)}`, sub: c.phone, action: "switch-client", actionData: c.id
      }))
    ];

    return `
      <section class="c-page">
        <div class="c-page-head" style="margin-bottom:14px;">
          <div class="c-page-head__title">
            <h1 style="font-size:24px; letter-spacing:-0.3px;">Profil</h1>
          </div>
          <button class="c-link" type="button" data-action="profile-edit">Edit</button>
        </div>

        <section class="c-profile-hero">
          <div class="c-profile-hero__top">
            <div class="c-avatar c-avatar--lg">${escapeHtml(initials(customer.name))}</div>
            <div class="c-profile-hero__copy">
              <strong>${escapeHtml(customer.name)}</strong>
              <span>${escapeHtml(customer.phone)}</span>
            </div>
            <span class="c-profile-hero__badge">${tier}</span>
          </div>
          <div class="c-profile-hero__stats">
            <div class="c-profile-hero__stat">
              <p>POIN</p>
              <strong>${customer.points}</strong>
            </div>
            <div class="c-profile-hero__stat">
              <p>TOTAL ORDER</p>
              <strong>${totalOrders}</strong>
            </div>
          </div>
        </section>

        <section class="c-card c-card--flush c-settings">
          ${group1.map(renderSettingsRow).join("")}
        </section>

        <section class="c-card c-card--flush c-settings">
          ${group2.map(renderSettingsRow).join("")}
        </section>

        <section class="c-card c-card--flush c-settings">
          ${group3.map(renderSettingsRow).join("")}
        </section>

        <button class="c-logout" type="button" data-action="client-logout">
          ${icon("logout")} Keluar
        </button>
      </section>
    `;
  }

  function renderSettingsRow(item) {
    const dataAttr = item.actionData ? `data-id="${escapeAttr(item.actionData)}"` : "";
    return `
      <button class="c-settings__row" type="button" data-action="${item.action}" ${dataAttr}>
        <span class="c-settings__icon">${icon(item.icon)}</span>
        <div class="c-settings__copy">
          <strong>${escapeHtml(item.label)}${item.badge ? ` <span class="c-settings__badge">${escapeHtml(item.badge)}</span>` : ""}</strong>
          <span>${escapeHtml(item.sub)}</span>
        </div>
        <span class="c-row__chev">${icon("chev")}</span>
      </button>
    `;
  }

  function renderOrderFilters() {
    const filters = [
      ["all", "Semua"],
      ["active", "Proses"],
      ["ready", "Siap ambil"],
      ["unpaid", "Belum bayar"],
      ["delivery", "Pickup/Delivery"],
      ["late", "Telat"]
    ];
    return `
      <div class="filter-scroller" aria-label="Filter order">
        ${filters
          .map(
            ([id, label]) => `<button class="filter-chip ${ui.orderFilter === id ? "active" : ""}" type="button" data-action="set-order-filter" data-filter="${id}">${label}</button>`
          )
          .join("")}
      </div>
    `;
  }

  function renderOrderCard(order) {
    const customer = getCustomer(order.customerId);
    const status = getStatus(order.status);
    const next = getNextStatus(order.status);
    return `
      <article class="order-card">
        <div class="order-main">
          <div class="order-title">
            <strong>${escapeHtml(order.number)} - ${escapeHtml(customer?.name || order.customerName)}</strong>
            <span class="muted">${escapeHtml(order.serviceName)} - ${formatQty(order)} - due ${relativeDue(order.dueAt)}</span>
          </div>
          <span class="status-chip ${status.tone}">${status.label}</span>
        </div>
        <div class="order-meta">
          <span class="small-chip">${formatCurrency(order.total)}</span>
          <span class="small-chip">${paymentLabel(order.paymentStatus)}</span>
          <span class="small-chip">${fulfillmentLabel(order.fulfillment)}</span>
          ${isLate(order) ? '<span class="status-chip danger">Telat</span>' : ""}
        </div>
        ${renderProgress(order)}
        <div class="order-actions">
          <button class="ghost-button" type="button" data-action="open-order" data-id="${order.id}">Detail</button>
          <button class="button secondary" type="button" data-action="send-whatsapp" data-id="${order.id}">Kirim WA</button>
          <button class="button" type="button" data-action="next-status" data-id="${order.id}" ${!next ? "disabled" : ""}>${next ? `Ke ${next.label}` : "Selesai"}</button>
        </div>
      </article>
    `;
  }

  function renderClientOrderCard(order) {
    // Legacy card — kept for compatibility with modals/owner contexts.
    const status = getStatus(order.status);
    return `
      <article class="client-order-card">
        <div class="order-main">
          <div class="order-title">
            <strong>${escapeHtml(order.number)}</strong>
            <span class="muted">${escapeHtml(order.serviceName)} - estimasi ${formatShortDate(order.dueAt)}</span>
          </div>
          <span class="status-chip ${status.tone}">${status.client}</span>
        </div>
        <div class="order-meta">
          <span class="small-chip">${formatCurrency(order.total)}</span>
          <span class="small-chip">${paymentLabel(order.paymentStatus)}</span>
          <span class="small-chip">${fulfillmentLabel(order.fulfillment)}</span>
        </div>
        ${renderProgress(order)}
        <div class="order-actions">
          <button class="button" type="button" data-action="open-client-order" data-id="${order.id}">Lacak order</button>
          <button class="ghost-button" type="button" data-action="client-chat" data-id="${order.id}">Chat laundry</button>
        </div>
      </article>
    `;
  }

  function renderClientTrackingDetail(order) {
    const progress = clientProgressIndex(order.status);
    const step = clientProgressSteps[Math.min(progress, 4)];
    const customer = getCustomer(order.customerId);
    const courier = courierForOrder(order);
    return `
      <section class="c-hero" style="margin-bottom:16px;">
        <div class="c-hero__row">
          <div>
            <p class="c-hero__eyebrow">STATUS</p>
            <h3 class="c-hero__title c-hero__title--lg">${escapeHtml(step.heroTitle)}</h3>
          </div>
          <span class="c-pill c-pill--warning">${escapeHtml(getStatus(order.status).client)}</span>
        </div>
        <div class="c-hero__divider">
          <div>
            <p>ETA</p>
            <strong>${escapeHtml(formatShortDate(order.dueAt))}</strong>
          </div>
          <div>
            <p>Layanan</p>
            <strong>${escapeHtml(order.serviceName)} · ${formatQty(order)}</strong>
          </div>
        </div>
      </section>

      <section class="c-card c-courier">
        <div class="c-courier__avatar">${escapeHtml(initials(courier.name))}</div>
        <div class="c-courier__copy">
          <p>KURIR KAMU</p>
          <strong>${escapeHtml(courier.name)}</strong>
          <span>${escapeHtml(courier.plate)} · rating ${courier.rating} ★</span>
        </div>
        <button class="c-courier__call" type="button" data-action="call-courier" data-id="${order.id}" aria-label="Telepon kurir">
          ${icon("phone", "#fff")}
        </button>
      </section>

      <h3 class="c-section-label" style="margin-top:4px;">Progress laundry</h3>
      <section class="c-card c-card--pad14">
        ${renderClientTimeline(order)}
      </section>

      <div style="display:flex; gap:8px; margin-top:14px;">
        <button class="c-btn c-btn--outline c-btn--full" type="button" data-action="client-chat" data-id="${order.id}">Chat laundry</button>
        <button class="c-btn c-btn--ghost c-btn--full" type="button" data-action="copy-tracking-link" data-id="${order.id}">Salin link</button>
      </div>
      ${order.paymentStatus !== "paid" ? `
        <button class="c-btn c-btn--accent c-btn--full" type="button" data-action="open-payment" data-id="${order.id}" style="margin-top:10px;">
          Bayar ${escapeHtml(formatCurrency(order.total))}
        </button>
      ` : ""}
    `;
  }

  const clientProgressSteps = [
    { id: "pickup",   label: "Dijemput",    iconName: "truck",  heroTitle: "Kurir menuju ke lokasi" },
    { id: "wash",     label: "Dicuci",      iconName: "bag",    heroTitle: "Laundry kamu sedang dicuci" },
    { id: "dry",      label: "Dikeringkan", iconName: "sparkle",heroTitle: "Dikeringkan dengan cermat" },
    { id: "pack",     label: "Dikemas",     iconName: "hanger", heroTitle: "Laundry kamu hampir siap 🎉" },
    { id: "ready",    label: "Siap Antar",  iconName: "check",  heroTitle: "Siap diantar ke kamu" }
  ];

  function clientProgressIndex(status) {
    // Maps internal statusFlow to the 5-step client timeline.
    if (["created", "received", "weighed"].includes(status)) return 0;
    if (status === "washing") return 1;
    if (status === "drying") return 2;
    if (["ironing", "packing"].includes(status)) return 3;
    if (["ready", "out_for_delivery", "completed"].includes(status)) return 4;
    return 0;
  }

  function renderClientTimeline(order) {
    const progress = clientProgressIndex(order.status);
    const now = new Date();
    return `
      <div class="c-timeline-new">
        ${clientProgressSteps.map((step, index) => {
          const done = index < progress;
          const current = index === progress && order.status !== "completed";
          const stateClass = done ? "is-done" : current ? "is-current" : "";
          const time = timelineStepTime(step, index, progress, order, now);
          return `
            <div class="c-timeline-new__step ${stateClass}">
              <span class="c-timeline-new__icon">${icon(step.iconName)}</span>
              <div class="c-timeline-new__copy">
                <strong>${escapeHtml(step.label)}</strong>
                ${current ? `<span class="c-pill c-pill--accent c-pill--sm" style="vertical-align:middle;">Sekarang</span>` : ""}
                <span>${escapeHtml(time)}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function timelineStepTime(step, index, progress, order, now) {
    if (index < progress) return "Sudah selesai";
    if (index === progress) return order.status === "completed" ? "Selesai" : "Sedang berlangsung";
    if (index === progress + 1) return `Estimasi ${formatShortDate(order.dueAt)}`;
    return "Menunggu";
  }

  function renderModal(modal) {
    if (modal.type === "order-form") return renderOrderForm("owner");
    if (modal.type === "client-order-form") return renderOrderForm("client");
    if (modal.type === "order-detail") return renderOrderDetail(modal.id);
    if (modal.type === "client-order-detail") return renderClientOrderDetail(modal.id);
    if (modal.type === "customer-detail") return renderCustomerDetail(modal.id);
    if (modal.type === "service-edit") return renderServiceEdit(modal.id);
    return "";
  }

  function renderOrderForm(mode) {
    const customer = mode === "client" ? getSelectedClient() : null;
    const defaultService = data.services[0];
    return `
      <div class="sheet-backdrop" data-action="close-modal">
        <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="order-form-title" data-sheet>
          <div class="sheet-header">
            <h2 id="order-form-title">${mode === "client" ? "Buat order laundry" : "Order baru"}</h2>
            <button class="icon-button" type="button" data-action="close-modal">x</button>
          </div>
          <form class="sheet-body form-grid" id="order-form" data-mode="${mode}">
            <div class="two-col">
              <div class="field">
                <label for="customerName">Nama pelanggan</label>
                <input class="input" id="customerName" name="customerName" value="${escapeAttr(customer?.name || "")}" ${mode === "client" ? "readonly" : ""} required />
              </div>
              <div class="field">
                <label for="phone">Nomor WhatsApp</label>
                <input class="input" id="phone" name="phone" value="${escapeAttr(customer?.phone || "")}" ${mode === "client" ? "readonly" : ""} required />
              </div>
            </div>
            <div class="field">
              <label for="address">Alamat pickup/delivery</label>
              <input class="input" id="address" name="address" value="${escapeAttr(customer?.address || "")}" placeholder="Opsional jika antar sendiri" />
            </div>
            <div class="two-col">
              <div class="field">
                <label for="serviceId">Layanan</label>
                <select class="select" id="serviceId" name="serviceId" data-input="estimate-field">
                  ${data.services.map((service) => `<option value="${service.id}">${escapeHtml(service.name)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="qty">Jumlah / berat</label>
                <input class="input" id="qty" name="qty" type="number" min="0.5" step="0.1" value="${defaultService.unit === "kg" ? "3" : "1"}" data-input="estimate-field" required />
              </div>
            </div>
            <div class="two-col">
              <div class="field">
                <label for="fulfillment">Pickup / delivery</label>
                <select class="select" id="fulfillment" name="fulfillment" data-input="estimate-field">
                  <option value="store">Antar sendiri</option>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div class="field">
                <label for="paymentStatus">Pembayaran</label>
                <select class="select" id="paymentStatus" name="paymentStatus">
                  <option value="unpaid">Belum bayar</option>
                  <option value="paid">Lunas</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label for="notes">Catatan khusus</label>
              <textarea class="textarea" id="notes" name="notes" placeholder="Contoh: noda berat, parfum soft, lipat saja"></textarea>
            </div>
            <div class="estimate-box" id="order-estimate">
              <span>Estimasi biaya</span>
              <strong>${formatCurrency(defaultService.price * 3)}</strong>
            </div>
            <button class="button" type="submit">${mode === "client" ? "Konfirmasi order" : "Simpan order"}</button>
          </form>
        </section>
      </div>
    `;
  }

  function renderOrderDetail(id) {
    const order = getOrder(id);
    if (!order) return "";
    const customer = getCustomer(order.customerId);
    return `
      <div class="sheet-backdrop" data-action="close-modal">
        <section class="bottom-sheet" role="dialog" aria-modal="true" data-sheet>
          <div class="sheet-header">
            <div>
              <h2>${escapeHtml(order.number)}</h2>
              <p class="eyebrow">${escapeHtml(customer?.name || order.customerName)}</p>
            </div>
            <button class="icon-button" type="button" data-action="close-modal">x</button>
          </div>
          <div class="sheet-body">
            <div class="insight-list">
              ${renderInsight("Status", getStatus(order.status).label, `Update terakhir ${formatShortDate(order.updatedAt)}`)}
              ${renderInsight("Layanan", `${order.serviceName} - ${formatQty(order)}`, order.notes || "Tidak ada catatan khusus")}
              ${renderInsight("Pembayaran", `${paymentLabel(order.paymentStatus)} - ${order.paymentMethod}`, formatCurrency(order.total))}
              ${renderInsight("Pickup / delivery", fulfillmentLabel(order.fulfillment), order.address || "Ambil di outlet")}
            </div>
            <section class="panel">
              <div class="panel-header">
                <div>
                  <h3>Timeline internal</h3>
                  <p>Status detail untuk owner dan staff.</p>
                </div>
              </div>
              ${renderInternalTimeline(order)}
            </section>
            <div class="order-actions">
              <button class="button" type="button" data-action="next-status" data-id="${order.id}">Update status</button>
              <button class="ghost-button" type="button" data-action="toggle-paid" data-id="${order.id}">${order.paymentStatus === "paid" ? "Tandai belum bayar" : "Tandai lunas"}</button>
              <button class="button secondary" type="button" data-action="send-whatsapp" data-id="${order.id}">Kirim WA</button>
              <button class="ghost-button" type="button" data-action="copy-tracking-link" data-id="${order.id}">Salin link tracking</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function renderClientOrderDetail(id) {
    const order = getOrder(id);
    if (!order) return "";
    return `
      <div class="sheet-backdrop" data-action="close-modal">
        <section class="bottom-sheet" role="dialog" aria-modal="true" data-sheet>
          <div class="sheet-header">
            <div>
              <h2>${escapeHtml(order.number)}</h2>
              <p class="eyebrow">Invoice dan tracking laundry</p>
            </div>
            <button class="icon-button" type="button" data-action="close-modal">x</button>
          </div>
          <div class="sheet-body">
            <div class="insight-list">
              ${renderInsight("Status", getStatus(order.status).client, `Estimasi ${formatShortDate(order.dueAt)}`)}
              ${renderInsight("Layanan", `${order.serviceName} - ${formatQty(order)}`, order.notes || "Tidak ada catatan khusus")}
              ${renderInsight("Pembayaran", paymentLabel(order.paymentStatus), formatCurrency(order.total))}
              ${renderInsight("Metode", fulfillmentLabel(order.fulfillment), order.address || data.outlet.address)}
            </div>
            <section class="panel">
              <div class="panel-header">
                <div>
                  <h3>Tracking</h3>
                  <p>Status diringkas agar mudah dipahami.</p>
                </div>
              </div>
              ${renderClientTimeline(order)}
            </section>
            <div class="order-actions">
              <button class="button" type="button" data-action="client-chat" data-id="${order.id}">Chat laundry</button>
              <button class="ghost-button" type="button" data-action="copy-tracking-link" data-id="${order.id}">Salin link</button>
              <button class="ghost-button" type="button" data-action="close-modal">Tutup</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function renderInternalTimeline(order) {
    const current = statusIndex(order.status);
    return `
      <div class="timeline">
        ${statusFlow
          .map(
            (status, index) => `
              <div class="timeline-step ${index <= current ? "done" : ""} ${index === current ? "current" : ""}">
                <div class="timeline-dot">${index <= current ? "OK" : index + 1}</div>
                <div class="timeline-copy">
                  <strong>${status.label}</strong>
                  <span>${status.client}</span>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderCustomerDetail(id) {
    const customer = getCustomer(id);
    if (!customer) return "";
    const orders = getClientOrders(id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const spent = orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.total, 0);
    return `
      <div class="sheet-backdrop" data-action="close-modal">
        <section class="bottom-sheet" role="dialog" aria-modal="true" data-sheet>
          <div class="sheet-header">
            <div>
              <h2>${escapeHtml(customer.name)}</h2>
              <p class="eyebrow">${escapeHtml(customer.phone)}</p>
            </div>
            <button class="icon-button" type="button" data-action="close-modal">x</button>
          </div>
          <div class="sheet-body">
            <div class="dashboard-grid">
              ${statCard("Total order", orders.length, "Sejak terdaftar")}
              ${statCard("Total belanja", formatCurrency(spent), "Transaksi lunas")}
            </div>
            <section class="panel">
              <div class="panel-header">
                <div>
                  <h3>Riwayat terakhir</h3>
                  <p>${escapeHtml(customer.address)}</p>
                </div>
              </div>
              ${orders.length ? `<div class="order-list">${orders.slice(0, 5).map(renderOrderCard).join("")}</div>` : renderEmpty("Belum ada order.")}
            </section>
          </div>
        </section>
      </div>
    `;
  }

  function renderServiceEdit(id) {
    const service = data.services.find((item) => item.id === id);
    if (!service) return "";
    return `
      <div class="sheet-backdrop" data-action="close-modal">
        <section class="bottom-sheet" role="dialog" aria-modal="true" data-sheet>
          <div class="sheet-header">
            <h2>Edit layanan</h2>
            <button class="icon-button" type="button" data-action="close-modal">x</button>
          </div>
          <form class="sheet-body form-grid" id="service-form" data-id="${service.id}">
            <div class="field">
              <label for="serviceName">Nama layanan</label>
              <input class="input" id="serviceName" name="name" value="${escapeAttr(service.name)}" required />
            </div>
            <div class="two-col">
              <div class="field">
                <label for="servicePrice">Harga</label>
                <input class="input" id="servicePrice" name="price" type="number" min="0" value="${service.price}" required />
              </div>
              <div class="field">
                <label for="serviceEta">Estimasi jam</label>
                <input class="input" id="serviceEta" name="etaHours" type="number" min="1" value="${service.etaHours}" required />
              </div>
            </div>
            <button class="button" type="submit">Simpan layanan</button>
          </form>
        </section>
      </div>
    `;
  }

  function renderInsight(label, value, note) {
    return `
      <article class="insight-row">
        <div class="row-copy">
          <strong>${escapeHtml(String(value))}</strong>
          <span>${escapeHtml(label)} - ${escapeHtml(String(note))}</span>
        </div>
      </article>
    `;
  }

  function renderProgress(order) {
    const percent = Math.max(8, Math.round((statusIndex(order.status) / (statusFlow.length - 1)) * 100));
    return `
      <div class="progress-line" aria-label="Progres order ${percent}%">
        <span style="width: ${percent}%"></span>
      </div>
    `;
  }

  function renderEmpty(message) {
    return `
      <div class="empty-state">
        <img src="assets/laundry-basket.svg" alt="" />
        <strong>${escapeHtml(message)}</strong>
        <span>Data akan muncul otomatis saat order dibuat.</span>
      </div>
    `;
  }

  function statCard(label, value, note, tone = "") {
    return `
      <article class="stat-card ${tone}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
        <small class="metric-note">${escapeHtml(note)}</small>
      </article>
    `;
  }

  // ============================================================
  //  CLIENT REDESIGN — screens, icons, helpers
  // ============================================================

  function renderSplashScreen() {
    return `
      <section class="c-splash">
        <div class="c-splash__logo">
          <img src="assets/laundry-basket.svg" alt="LaundAps" />
        </div>
        <div class="c-splash__body">
          <p class="c-splash__eyebrow">LAUNDAPS</p>
          <h1 class="c-splash__headline">Laundry kamu,<br/>jelas statusnya.</h1>
          <p class="c-splash__sub">Pesan, lacak, dan bayar laundry dari HP — tanpa perlu chat bolak-balik.</p>
          <button class="c-btn c-btn--accent c-btn--full c-btn--lg" type="button" data-action="dismiss-splash">Mulai Sekarang</button>
          <p class="c-splash__footer">Sudah punya akun? <button type="button" data-action="dismiss-splash">Masuk</button></p>
        </div>
      </section>
    `;
  }

  function renderClientBottomNav() {
    const active = clientNavTabs.has(ui.clientTab) ? ui.clientTab : "";
    return `
      <nav class="c-bottom-nav" aria-label="Navigasi utama">
        <div class="c-bottom-nav__inner">
          ${clientTabs.map((tab) => `
            <button class="c-nav-item ${active === tab.id ? "is-active" : ""}" type="button" data-action="set-tab" data-tab="${tab.id}">
              ${icon(tab.icon)}
              <span>${escapeHtml(tab.label)}</span>
            </button>
          `).join("")}
        </div>
      </nav>
    `;
  }

  function renderClientPaymentPage() {
    const order = ui.paymentOrderId ? getOrder(ui.paymentOrderId) : null;
    if (!order) {
      return `
        <section class="c-page">
          <div class="c-page-head">
            <button class="c-icon-btn" type="button" data-action="go-tab" data-tab="home" aria-label="Kembali">${icon("chevLeft")}</button>
            <div class="c-page-head__title"><h1>Pembayaran</h1><p>Tidak ada order aktif</p></div>
          </div>
          <div class="c-card c-empty">
            <div class="c-empty__illust"><span class="p1"></span><span class="p2"></span><span class="p3"></span><span class="p4"></span></div>
            <strong>Belum ada order untuk dibayar</strong>
            <p>Buat order baru untuk melanjutkan ke pembayaran.</p>
            <button class="c-btn c-btn--primary" type="button" data-action="go-tab" data-tab="create" style="margin-top:8px;">Buat order</button>
          </div>
        </section>
      `;
    }

    const pickupFee = order.fulfillment === "pickup" ? 5000 : 0;
    const deliveryFee = order.fulfillment === "delivery" ? 10000 : 0;
    const discount = Math.min(order.subtotal, Math.round(order.subtotal * 0.12));
    const finalTotal = order.total - discount;
    const activeMethod = paymentMethods.find((m) => m.id === ui.paymentMethodId) || paymentMethods[0];

    return `
      <section class="c-page">
        <div class="c-page-head">
          <button class="c-icon-btn" type="button" data-action="track-order" data-id="${order.id}" aria-label="Kembali">${icon("chevLeft")}</button>
          <div class="c-page-head__title">
            <h1>Pembayaran</h1>
            <p>${escapeHtml(order.number)}</p>
          </div>
        </div>

        <section class="c-card" style="margin-bottom:18px;">
          <h3 class="c-section-label" style="margin-bottom:12px;">Ringkasan biaya</h3>
          <div class="c-cost-line">
            <span>${escapeHtml(order.serviceName)} (${formatQty(order)})</span>
            <strong>${escapeHtml(formatCurrency(order.subtotal))}</strong>
          </div>
          ${pickupFee ? `<div class="c-cost-line"><span>Biaya jemput</span><strong>${escapeHtml(formatCurrency(pickupFee))}</strong></div>` : ""}
          ${deliveryFee ? `<div class="c-cost-line"><span>Biaya antar</span><strong>${escapeHtml(formatCurrency(deliveryFee))}</strong></div>` : ""}
          ${discount ? `<div class="c-cost-line is-discount"><span>Diskon pelanggan</span><strong>-${escapeHtml(formatCurrency(discount))}</strong></div>` : ""}
          <div class="c-cost-divider"></div>
          <div class="c-cost-total">
            <p>Total bayar</p>
            <strong>${escapeHtml(formatCurrency(finalTotal))}</strong>
          </div>
        </section>

        ${discount ? `
          <div class="c-voucher-chip">
            <span class="c-voucher-chip__icon">${icon("gift")}</span>
            <div class="c-voucher-chip__copy">
              <strong>Voucher HEMAT8 diterapkan</strong>
              <span>Hemat ${escapeHtml(formatCurrency(discount))}</span>
            </div>
            <button class="c-row__action" type="button" data-action="change-voucher" style="color:var(--c-accent-deep);">Ganti</button>
          </div>
        ` : ""}

        <h3 class="c-section-label">Metode pembayaran</h3>
        <div class="c-method-list">
          ${paymentMethods.map((m) => `
            <button class="c-method ${m.id === activeMethod.id ? "is-active" : ""}" type="button" data-action="set-payment-method" data-method="${m.id}">
              <span class="c-method__icon">${icon(m.icon)}</span>
              <div class="c-method__body">
                <div class="c-method__title">
                  <strong>${escapeHtml(m.name)}</strong>
                  <span class="c-method__tag">${escapeHtml(m.tag)}</span>
                </div>
                <span class="c-method__sub">${escapeHtml(m.sub)}</span>
              </div>
              <span class="c-method__radio"></span>
            </button>
          `).join("")}
        </div>
      </section>

      <div class="c-sticky-cta">
        <div class="c-sticky-cta__row">
          <div class="c-sticky-cta__price">
            <p>Total</p>
            <strong>${escapeHtml(formatCurrency(finalTotal))}</strong>
          </div>
        </div>
        <button class="c-btn c-btn--accent c-btn--full" type="button" data-action="pay-order" data-id="${order.id}">
          Bayar dengan ${escapeHtml(activeMethod.name)}
        </button>
      </div>
    `;
  }

  function renderClientReportPage() {
    const customer = getSelectedClient();
    const range = ui.clientReportRange;
    const stats = computeClientReport(customer.id, range);

    return `
      <section class="c-page">
        <h1 class="c-page-title">Laporan</h1>
        <p class="c-page-subtitle">Pantau pengeluaran laundry kamu</p>

        <div class="c-range-switch" role="tablist">
          ${[["week","Minggu"],["month","Bulan"],["year","Tahun"]].map(([id, label]) => `
            <button class="${range === id ? "is-active" : ""}" type="button" data-action="set-client-report-range" data-range="${id}">${label}</button>
          `).join("")}
        </div>

        <section class="c-report-hero">
          <p class="c-report-hero__label">${escapeHtml(stats.heroLabel)}</p>
          <p class="c-report-hero__value">${escapeHtml(formatCurrency(stats.currentSpend))}</p>
          <p class="c-report-hero__delta">
            ${stats.delta != null ? `<b>${stats.delta >= 0 ? "↑" : "↓"} ${Math.abs(stats.delta)}%</b> dibanding periode lalu` : "Data periode ini"}
          </p>
        </section>

        <section class="c-card" style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h3 style="margin:0; font:800 13px/1 Inter,sans-serif;">Tren ${range === "year" ? "bulanan" : range === "week" ? "harian" : "6 bulan"}</h3>
            <span style="font-size:11px; color:var(--c-muted);">dalam ribu Rp</span>
          </div>
          <div class="c-bar-chart">
            ${stats.chart.map((c) => `
              <div class="c-bar-col ${c.active ? "is-active" : ""}">
                <span class="c-bar-col__value">${c.valueLabel}</span>
                <span class="c-bar-col__bar" style="height:${Math.max(4, Math.round(c.ratio * 96))}px;"></span>
                <span class="c-bar-col__label">${escapeHtml(c.label)}</span>
              </div>
            `).join("")}
          </div>
        </section>

        <div class="c-stat-duo">
          <div class="c-card c-card--pad14">
            <p>TOTAL ORDER</p>
            <strong>${stats.totalOrders}</strong>
            <small class="${stats.orderDelta > 0 ? "is-positive" : ""}">${stats.orderDelta > 0 ? "+" : ""}${stats.orderDelta} periode ini</small>
          </div>
          <div class="c-card c-card--pad14">
            <p>RATA-RATA</p>
            <strong>${escapeHtml(formatShortCurrency(stats.avgOrder))}</strong>
            <small>per order</small>
          </div>
        </div>

        <h3 class="c-section-label" style="margin-top:4px;">Layanan favorit</h3>
        <section class="c-card c-card--pad14">
          ${stats.favorites.length ? `
            <div class="c-fav-list">
              ${stats.favorites.map((fav, i) => `
                <div>
                  <div class="c-fav-item__head">
                    <strong>${escapeHtml(fav.name)}</strong>
                    <span>${fav.count} order · ${fav.pct}%</span>
                  </div>
                  <div class="c-fav-item__bar">
                    <span style="width:${fav.pct}%; background:${favColor(i)};"></span>
                  </div>
                </div>
              `).join("")}
            </div>
          ` : `<p style="margin:0; color:var(--c-muted); font-size:13px;">Belum ada data cukup untuk periode ini.</p>`}
        </section>
      </section>
    `;
  }

  // --- Icon system --------------------------------------------
  const ICON_SVG = {
    home:    `<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9.5Z"/>`,
    plus:    `<path d="M12 5v14M5 12h14"/>`,
    pin:     `<path d="M12 21s-7-6.5-7-11a7 7 0 1 1 14 0c0 4.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>`,
    chart:   `<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>`,
    user:    `<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>`,
    bell:    `<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/>`,
    search:  `<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
    chev:    `<path d="m9 6 6 6-6 6"/>`,
    chevLeft:`<path d="m15 6-6 6 6 6"/>`,
    check:   `<path d="m5 12 5 5L20 7"/>`,
    close:   `<path d="M6 6l12 12M18 6 6 18"/>`,
    sparkle: `<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>`,
    truck:   `<path d="M2 7h12v9H2zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>`,
    clock:   `<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>`,
    credit:  `<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>`,
    wallet:  `<path d="M3 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M19 12h-4a2 2 0 0 0 0 4h4"/><path d="M3 7V5a2 2 0 0 1 2-2h10l2 4"/>`,
    cash:    `<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>`,
    bag:     `<path d="M5 8h14l-1.5 12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
    hanger:  `<path d="M12 6a2 2 0 1 1 2 2l-2 2v2"/><path d="M4 18 12 12l8 6v2H4z"/>`,
    iron:    `<path d="M3 16h18l-2-7a4 4 0 0 0-4-3H9a4 4 0 0 0-4 3l-2 7Z"/><path d="M3 20h18"/>`,
    phone:   `<path d="M4 5c0 9 6 15 15 15l2-3-4-2-2 2a13 13 0 0 1-6-6l2-2-2-4-3 0Z"/>`,
    note:    `<path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14 4v5h5"/>`,
    gift:    `<rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 13h18M12 9v11"/><path d="M8 9a3 3 0 0 1 4-4 3 3 0 0 1 4 4"/>`,
    logout:  `<path d="M9 4h9a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9"/><path d="m13 12-8 0M8 8l-4 4 4 4"/>`,
    help:    `<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2.5-2.5 4"/><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"/>`,
    "star-solid": `<path d="m12 3 2.6 5.9 6.4.6-4.8 4.4 1.4 6.4L12 17.3 6.4 20.3l1.4-6.4L3 9.5l6.4-.6L12 3Z" fill="currentColor" stroke="none"/>`
  };

  function icon(name, color = "currentColor", width = 2) {
    const path = ICON_SVG[name];
    if (!path) return "";
    const stroke = name === "star-solid" ? "" : `stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
    const fill = name === "star-solid" ? `fill="${color}"` : `fill="none"`;
    const size = name === "star-solid" ? 14 : name === "bell" || name === "search" || name === "clock" || name === "sparkle" || name === "phone" || name === "note" || name === "gift" || name === "logout" || name === "help" ? 18 : name === "chev" || name === "check" || name === "close" ? 16 : name === "chevLeft" ? 18 : 22;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ${fill} ${stroke} aria-hidden="true">${path}</svg>`;
  }

  // --- Form + data helpers ------------------------------------

  function createInitialCreateForm() {
    const firstService = data?.services?.[0];
    return {
      serviceId: firstService?.id || "",
      date: "today",
      time: "12:00",
      qty: firstService && firstService.unit === "kg" ? 4 : 1
    };
  }

  function greetingFor(date) {
    const h = date.getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 19) return "Selamat sore";
    return "Selamat malam";
  }

  function buildDateChips(activeKey) {
    const names = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const today = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = i === 0 ? "today" : i === 1 ? "tomorrow" : `day+${i}`;
      const label = i === 0 ? "Hari ini" : i === 1 ? "Besok" : names[d.getDay()];
      const date = `${d.getDate()} ${months[d.getMonth()]}`;
      return { key, label, date, active: activeKey === key };
    });
  }

  function historyTone(order) {
    if (order.status === "completed") return "success";
    if (["ready", "out_for_delivery"].includes(order.status)) return "primary";
    return "warning";
  }

  function historyLabel(order) {
    if (order.status === "completed") return "Selesai";
    if (order.status === "ready") return "Siap ambil";
    if (order.status === "out_for_delivery") return "Dikirim";
    return "Diproses";
  }

  function formatHistoryDate(value) {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const d = new Date(value);
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function courierForOrder(order) {
    const names = [
      { name: "Budi Santoso",   plate: "D 1234 ABC", rating: 4.9 },
      { name: "Sari Kurniawan", plate: "D 5678 XYZ", rating: 4.8 },
      { name: "Agus Wahyudi",   plate: "D 9012 JKL", rating: 4.9 }
    ];
    const idx = order ? Math.abs(hashCode(order.id)) % names.length : 0;
    return names[idx];
  }

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return h;
  }

  function formatShortCurrency(value) {
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}k`;
    return formatCurrency(value);
  }

  function favColor(i) {
    return i === 0 ? "var(--c-primary)" : i === 1 ? "var(--c-info)" : "var(--c-accent)";
  }

  function computeClientReport(customerId, range) {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const allOrders = getClientOrders(customerId);
    const paid = allOrders.filter((o) => o.paymentStatus === "paid");

    // current period orders
    let inPeriod, previous;
    let heroLabel;
    let chart = [];

    if (range === "week") {
      heroLabel = "PENGELUARAN MINGGU INI";
      inPeriod = paid.filter((o) => daysBetween(o.createdAt, now) <= 7);
      previous = paid.filter((o) => {
        const d = daysBetween(o.createdAt, now);
        return d > 7 && d <= 14;
      });
      chart = buildDailyChart(paid, now);
    } else if (range === "year") {
      heroLabel = `PENGELUARAN ${now.getFullYear()}`;
      inPeriod = paid.filter((o) => new Date(o.createdAt).getFullYear() === now.getFullYear());
      previous = paid.filter((o) => new Date(o.createdAt).getFullYear() === now.getFullYear() - 1);
      chart = buildYearChart(paid, now);
    } else {
      heroLabel = `PENGELUARAN ${months[now.getMonth()].toUpperCase()}`;
      inPeriod = paid.filter((o) => isSameMonth(o.createdAt, now));
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      previous = paid.filter((o) => isSameMonth(o.createdAt, prevMonth));
      chart = build6MonthChart(paid, now);
    }

    const currentSpend = sumOrders(inPeriod);
    const prevSpend = sumOrders(previous);
    const delta = prevSpend > 0 ? Math.round(((currentSpend - prevSpend) / prevSpend) * 100) : (currentSpend > 0 ? 100 : null);

    // All-time total orders for stat duo feels more honest — but spec says "+ periode"
    const totalOrders = allOrders.length;
    const periodOrderCount = range === "week"
      ? allOrders.filter((o) => daysBetween(o.createdAt, now) <= 7).length
      : range === "year"
        ? allOrders.filter((o) => new Date(o.createdAt).getFullYear() === now.getFullYear()).length
        : allOrders.filter((o) => isSameMonth(o.createdAt, now)).length;

    const avgOrder = allOrders.length ? Math.round(sumOrders(allOrders) / allOrders.length) : 0;

    // favorites top 3
    const map = new Map();
    allOrders.forEach((o) => {
      const cur = map.get(o.serviceId) || { name: o.serviceName, count: 0 };
      cur.count += 1;
      map.set(o.serviceId, cur);
    });
    const favArr = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 3);
    const favTotal = favArr.reduce((s, f) => s + f.count, 0) || 1;
    const favorites = favArr.map((f) => ({
      name: f.name,
      count: f.count,
      pct: Math.round((f.count / favTotal) * 100)
    }));

    return {
      heroLabel,
      currentSpend,
      delta,
      totalOrders,
      orderDelta: periodOrderCount,
      avgOrder,
      favorites,
      chart
    };
  }

  function build6MonthChart(paid, now) {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const sum = sumOrders(paid.filter((o) => isSameMonth(o.createdAt, d)));
      arr.push({ label: months[d.getMonth()], value: sum });
    }
    return normalizeChart(arr);
  }

  function buildDailyChart(paid, now) {
    const names = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const sum = sumOrders(paid.filter((o) => isSameDay(o.createdAt, d)));
      arr.push({ label: names[d.getDay()], value: sum });
    }
    return normalizeChart(arr);
  }

  function buildYearChart(paid, now) {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const arr = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 15);
      const sum = sumOrders(paid.filter((o) => isSameMonth(o.createdAt, d)));
      arr.push({ label: months[i], value: sum });
    }
    return normalizeChart(arr).slice(-6);
  }

  function normalizeChart(arr) {
    const max = Math.max(1, ...arr.map((a) => a.value));
    const activeIdx = arr.reduce((best, a, i) => (a.value > arr[best].value ? i : best), 0);
    return arr.map((a, i) => ({
      label: a.label,
      ratio: a.value / max,
      valueLabel: a.value ? Math.round(a.value / 1000).toString() : "",
      active: i === activeIdx && a.value > 0
    }));
  }

  function handleClick(event) {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    if (action === "close-modal" && event.target.closest("[data-sheet]") && !event.target.matches("[data-action='close-modal']")) {
      return;
    }

    if (action === "set-role") {
      ui.role = actionEl.dataset.role;
      ui.modal = null;
      render();
    }

    if (action === "set-tab") {
      if (ui.role === "owner") ui.ownerTab = actionEl.dataset.tab;
      else ui.clientTab = actionEl.dataset.tab;
      render();
    }

    if (action === "open-order-form") {
      ui.modal = { type: "order-form" };
      render();
      updateOrderEstimate();
    }

    if (action === "open-client-order-form") {
      ui.modal = { type: "client-order-form" };
      render();
      updateOrderEstimate();
    }

    if (action === "close-modal") {
      ui.modal = null;
      render();
    }

    if (action === "set-order-filter") {
      ui.orderFilter = actionEl.dataset.filter;
      render();
    }

    if (action === "set-report-range") {
      ui.reportRange = actionEl.dataset.range;
      render();
    }

    if (action === "next-status") {
      advanceOrder(actionEl.dataset.id);
    }

    if (action === "toggle-paid") {
      togglePaid(actionEl.dataset.id);
    }

    if (action === "open-order") {
      ui.modal = { type: "order-detail", id: actionEl.dataset.id };
      render();
    }

    if (action === "open-client-order") {
      ui.modal = { type: "client-order-detail", id: actionEl.dataset.id };
      render();
    }

    if (action === "open-customer") {
      ui.modal = { type: "customer-detail", id: actionEl.dataset.id };
      render();
    }

    if (action === "edit-service") {
      ui.modal = { type: "service-edit", id: actionEl.dataset.id };
      render();
    }

    if (action === "send-whatsapp" || action === "client-chat") {
      openWhatsApp(actionEl.dataset.id);
    }

    if (action === "copy-tracking-link") {
      copyTrackingLink(actionEl.dataset.id);
    }

    if (action === "copy-daily-summary") {
      copyDailySummary();
    }

    if (action === "reset-demo") {
      data = seedData();
      ui.selectedClientId = data.customers[0]?.id || "";
      saveState();
      showToast("Data demo sudah direset.");
      render();
    }

    // --- Client redesign handlers ---

    if (action === "dismiss-splash") {
      try { localStorage.setItem(SPLASH_KEY, "1"); } catch {}
      ui.showSplash = false;
      render();
    }

    if (action === "go-tab") {
      const tab = actionEl.dataset.tab;
      if (tab) {
        ui.clientTab = tab;
        render();
      }
    }

    if (action === "open-client-history") {
      ui.clientTab = "history";
      render();
    }

    if (action === "open-promo") {
      showToast("Promo akan segera hadir.");
    }

    if (action === "track-order") {
      const id = actionEl.dataset.id;
      ui.clientTab = "track";
      if (id) {
        ui.trackedOrderId = id;
        setTrackingParam(id);
      }
      render();
    }

    if (action === "set-create-service") {
      const svcId = actionEl.dataset.service;
      const svc = data.services.find((s) => s.id === svcId);
      if (svc) {
        ui.createForm.serviceId = svcId;
        ui.createForm.qty = svc.unit === "kg" ? 4 : 1;
        render();
      }
    }

    if (action === "set-create-date") {
      ui.createForm.date = actionEl.dataset.date;
      render();
    }

    if (action === "set-create-time") {
      ui.createForm.time = actionEl.dataset.time;
      render();
    }

    if (action === "edit-address") {
      showToast("Ubah alamat akan hadir di versi berikutnya.");
    }

    if (action === "confirm-client-order") {
      confirmClientOrder();
    }

    if (action === "tracking-info") {
      showToast("Detail tracking akan hadir di versi berikutnya.");
    }

    if (action === "call-courier") {
      const id = actionEl.dataset.id;
      const order = id ? getOrder(id) : null;
      if (order?.phone) {
        window.open(`tel:${order.phone}`, "_self");
      } else {
        showToast("Nomor kurir belum tersedia.");
      }
    }

    if (action === "set-history-filter") {
      ui.historyFilter = actionEl.dataset.filter;
      render();
    }

    if (action === "open-payment") {
      const id = actionEl.dataset.id;
      if (id) ui.paymentOrderId = id;
      ui.clientTab = "payment";
      render();
    }

    if (action === "change-voucher") {
      showToast("Pilihan voucher akan hadir di versi berikutnya.");
    }

    if (action === "set-payment-method") {
      ui.paymentMethodId = actionEl.dataset.method;
      render();
    }

    if (action === "pay-order") {
      const id = actionEl.dataset.id;
      const order = id ? getOrder(id) : null;
      if (order) {
        order.paymentStatus = "paid";
        const method = paymentMethods.find((m) => m.id === ui.paymentMethodId);
        order.paymentMethod = method ? method.name : "Tunai/QRIS";
        order.updatedAt = new Date().toISOString();
        saveState();
        showToast(`Pembayaran ${order.number} berhasil.`);
        ui.trackedOrderId = order.id;
        ui.paymentOrderId = "";
        ui.clientTab = "track";
        setTrackingParam(order.id);
        render();
      }
    }

    if (action === "set-client-report-range") {
      ui.clientReportRange = actionEl.dataset.range;
      render();
    }

    if (action === "switch-to-owner") {
      ui.role = "owner";
      ui.ownerTab = "dashboard";
      render();
    }

    if (action === "switch-client") {
      const id = actionEl.dataset.id;
      if (id) {
        ui.selectedClientId = id;
        render();
      }
    }

    if (action === "client-logout") {
      try { localStorage.removeItem(SPLASH_KEY); } catch {}
      ui.showSplash = true;
      ui.role = "client";
      ui.clientTab = "home";
      showToast("Kamu sudah keluar. Sampai jumpa lagi!");
      render();
    }

    if (action === "profile-personal" || action === "profile-edit") {
      showToast("Edit profil akan hadir di versi berikutnya.");
    }

    if (action === "profile-address") {
      showToast("Atur alamat akan hadir di versi berikutnya.");
    }

    if (action === "profile-payment") {
      showToast("Atur metode pembayaran akan hadir di versi berikutnya.");
    }

    if (action === "profile-notif") {
      showToast("Pengaturan notifikasi akan hadir di versi berikutnya.");
    }

    if (action === "profile-voucher") {
      showToast("Voucher & promo akan hadir di versi berikutnya.");
    }

    if (action === "profile-help") {
      showToast("Pusat bantuan akan hadir di versi berikutnya.");
    }
  }

  function confirmClientOrder() {
    const customer = getSelectedClient();
    if (!customer) {
      showToast("Profil pelanggan belum tersedia.");
      return;
    }
    const form = ui.createForm || createInitialCreateForm();
    const service = data.services.find((s) => s.id === form.serviceId) || data.services[0];
    if (!service) {
      showToast("Layanan tidak tersedia.");
      return;
    }
    const qty = Math.max(0.5, Number(form.qty) || (service.unit === "kg" ? 4 : 1));
    const fulfillment = "pickup";
    const deliveryFee = 5000;
    const subtotal = Math.round(qty * service.price);
    const now = new Date();
    const dayOffset = form.date === "today" ? 0 : form.date === "tomorrow" ? 1 : Number(String(form.date).split("+")[1] || 0);
    const [hh, mm] = String(form.time || "12:00").split(":").map((v) => Number(v) || 0);
    const pickupAt = new Date(now);
    pickupAt.setDate(pickupAt.getDate() + dayOffset);
    pickupAt.setHours(hh, mm, 0, 0);

    const order = {
      id: createId("ord"),
      number: makeOrderNumber(data.sequence, now),
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      serviceId: service.id,
      serviceName: service.name,
      unit: service.unit,
      qty,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      fulfillment,
      paymentStatus: "unpaid",
      paymentMethod: "Bayar nanti",
      status: "created",
      notes: `Jemput: ${form.time}`,
      createdAt: now.toISOString(),
      dueAt: addHours(pickupAt, service.etaHours).toISOString(),
      updatedAt: now.toISOString()
    };

    data.sequence += 1;
    data.orders.unshift(order);
    customer.points += Math.floor(order.total / 10000);
    saveState();

    ui.createForm = createInitialCreateForm();
    ui.paymentOrderId = order.id;
    ui.trackedOrderId = order.id;
    ui.clientTab = "payment";
    showToast(`Order ${order.number} dibuat. Lanjut ke pembayaran.`);
    render();
  }

  function handleSubmit(event) {
    if (event.target.id === "order-form") {
      event.preventDefault();
      createOrderFromForm(event.target);
    }

    if (event.target.id === "tracking-lookup-form") {
      event.preventDefault();
      lookupTrackingOrder(event.target);
    }

    if (event.target.id === "service-form") {
      event.preventDefault();
      updateServiceFromForm(event.target);
    }
  }

  function handleInput(event) {
    const input = event.target;
    if (input.dataset.input === "search-orders") {
      ui.search = input.value;
      const orderList = document.querySelector(".order-list");
      if (orderList) {
        const filtered = getFilteredOrders();
        orderList.innerHTML = filtered.length ? filtered.map(renderOrderCard).join("") : renderEmpty("Order tidak ditemukan.");
      }
    }

    if (input.dataset.input === "estimate-field") {
      updateOrderEstimate();
    }
  }

  function handleChange(event) {
    const input = event.target;
    if (input.dataset.input === "select-client") {
      ui.selectedClientId = input.value;
      render();
    }

    if (input.dataset.input === "estimate-field") {
      updateOrderEstimate();
    }
  }

  function createOrderFromForm(form) {
    const formData = new FormData(form);
    const mode = form.dataset.mode;
    const name = String(formData.get("customerName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const serviceId = String(formData.get("serviceId"));
    const service = data.services.find((item) => item.id === serviceId);
    const qty = Math.max(0.5, Number(formData.get("qty") || 1));
    const fulfillment = String(formData.get("fulfillment"));
    const paymentStatus = String(formData.get("paymentStatus"));
    const notes = String(formData.get("notes") || "").trim();

    let customer = data.customers.find((item) => normalizePhone(item.phone) === normalizePhone(phone));
    if (!customer) {
      customer = {
        id: createId("cus"),
        name,
        phone,
        address,
        points: 0
      };
      data.customers.push(customer);
    } else {
      customer.name = name || customer.name;
      customer.phone = phone || customer.phone;
      customer.address = address || customer.address;
    }

    const deliveryFee = fulfillment === "delivery" ? 10000 : fulfillment === "pickup" ? 5000 : 0;
    const subtotal = Math.round(qty * service.price);
    const now = new Date();
    const order = {
      id: createId("ord"),
      number: makeOrderNumber(data.sequence, now),
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      address: customer.address,
      serviceId: service.id,
      serviceName: service.name,
      unit: service.unit,
      qty,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      fulfillment,
      paymentStatus,
      paymentMethod: paymentStatus === "paid" ? "Tunai/QRIS" : "Bayar nanti",
      status: mode === "client" ? "created" : "received",
      notes,
      createdAt: now.toISOString(),
      dueAt: addHours(now, service.etaHours).toISOString(),
      updatedAt: now.toISOString()
    };

    data.sequence += 1;
    data.orders.unshift(order);
    customer.points += Math.floor(order.total / 10000);
    saveState();

    ui.modal = null;
    if (mode === "client") {
      ui.clientTab = "track";
      ui.selectedClientId = customer.id;
      ui.trackedOrderId = order.id;
      setTrackingParam(order.id);
    } else {
      ui.ownerTab = "orders";
      ui.orderFilter = "all";
    }
    showToast(`Order ${order.number} berhasil dibuat.`);
    render();
  }

  function updateServiceFromForm(form) {
    const service = data.services.find((item) => item.id === form.dataset.id);
    if (!service) return;
    const formData = new FormData(form);
    service.name = String(formData.get("name") || service.name).trim();
    service.price = Number(formData.get("price") || service.price);
    service.etaHours = Number(formData.get("etaHours") || service.etaHours);
    saveState();
    ui.modal = null;
    showToast("Layanan berhasil diperbarui.");
    render();
  }

  function updateOrderEstimate() {
    const form = document.getElementById("order-form");
    const estimate = document.getElementById("order-estimate");
    if (!form || !estimate) return;
    const service = data.services.find((item) => item.id === form.serviceId.value) || data.services[0];
    const qty = Math.max(0.5, Number(form.qty.value || 1));
    const fulfillment = form.fulfillment.value;
    const deliveryFee = fulfillment === "delivery" ? 10000 : fulfillment === "pickup" ? 5000 : 0;
    const total = Math.round(qty * service.price) + deliveryFee;
    estimate.innerHTML = `
      <span>Estimasi biaya<br><small>${formatCurrency(service.price)} / ${service.unit}${deliveryFee ? ` + ${formatCurrency(deliveryFee)}` : ""}</small></span>
      <strong>${formatCurrency(total)}</strong>
    `;
  }

  function advanceOrder(id) {
    const order = getOrder(id);
    if (!order) return;
    const next = getNextStatus(order.status);
    if (!next) return;
    order.status = next.id;
    order.updatedAt = new Date().toISOString();
    saveState();
    showToast(`Status ${order.number} menjadi ${next.label}.`);
    render();
  }

  function togglePaid(id) {
    const order = getOrder(id);
    if (!order) return;
    order.paymentStatus = order.paymentStatus === "paid" ? "unpaid" : "paid";
    order.paymentMethod = order.paymentStatus === "paid" ? "Tunai/QRIS" : "Bayar nanti";
    order.updatedAt = new Date().toISOString();
    saveState();
    showToast(order.paymentStatus === "paid" ? "Order ditandai lunas." : "Order ditandai belum bayar.");
    render();
  }

  function openWhatsApp(id) {
    const order = getOrder(id);
    if (!order) return;
    const customer = getCustomer(order.customerId);
    const message = [
      `Halo ${customer?.name || order.customerName}, update laundry ${order.number}:`,
      `Status: ${getStatus(order.status).client}.`,
      `Total: ${formatCurrency(order.total)}.`,
      `Estimasi selesai: ${formatShortDate(order.dueAt)}.`,
      `Tracking: ${trackingUrl(order)}.`,
      `Terima kasih.`
    ].join(" ");
    window.open(`https://wa.me/${toWaNumber(order.phone)}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  function copyTrackingLink(id) {
    const order = getOrder(id);
    if (!order) return;
    const link = trackingUrl(order);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => showToast("Link tracking disalin."));
    } else {
      showToast(link);
    }
  }

  function lookupTrackingOrder(form) {
    const formData = new FormData(form);
    const query = String(formData.get("query") || "").trim();
    ui.trackingSearch = query;
    if (!query) {
      showToast("Masukkan nomor invoice dulu.");
      return;
    }

    const normalized = query.toLowerCase();
    const order = data.orders.find((item) => item.number.toLowerCase() === normalized || item.id.toLowerCase() === normalized);
    if (!order) {
      showToast("Invoice tidak ditemukan di data demo.");
      render();
      return;
    }

    ui.role = "client";
    ui.clientTab = "track";
    ui.selectedClientId = order.customerId;
    ui.trackedOrderId = order.id;
    setTrackingParam(order.id);
    showToast(`Tracking ${order.number} dibuka.`);
    render();
  }

  function initRouteFromUrl() {
    const trackId = getTrackingParam();
    if (!trackId) return;
    const order = data.orders.find((item) => item.id === trackId || item.number.toLowerCase() === trackId.toLowerCase());
    if (!order) return;
    ui.role = "client";
    ui.clientTab = "track";
    ui.selectedClientId = order.customerId;
    ui.trackedOrderId = order.id;
  }

  function getTrackingParam() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("track");
    if (fromQuery) return fromQuery;
    const hash = window.location.hash.replace(/^#/, "");
    if (hash.startsWith("track=")) return hash.slice("track=".length);
    return "";
  }

  function setTrackingParam(id) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("track", id);
      url.hash = "";
      window.history.replaceState({}, "", url);
    } catch {
      window.location.hash = `track=${id}`;
    }
  }

  function trackingUrl(order) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("track", order.id);
      url.hash = "";
      return url.href;
    } catch {
      return `${window.location.href.split("#")[0]}#track=${order.id}`;
    }
  }

  function copyDailySummary() {
    const metrics = getDashboardMetrics();
    const summary = `Rekap ${data.outlet.name}: ${metrics.todayOrders} order hari ini, omzet ${formatCurrency(metrics.todayRevenue)}, diproses ${metrics.inProcess}, siap/belum diambil ${metrics.unclaimed}.`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(() => showToast("Rekap harian disalin."));
    } else {
      showToast(summary);
    }
  }

  function getDashboardMetrics() {
    const now = new Date();
    const todayOrders = data.orders.filter((order) => isSameDay(order.createdAt, now));
    const paidToday = todayOrders.filter((order) => order.paymentStatus === "paid");
    const paidMonth = data.orders.filter((order) => order.paymentStatus === "paid" && isSameMonth(order.createdAt, now));
    const inProcess = data.orders.filter((order) => !["ready", "out_for_delivery", "completed"].includes(order.status)).length;
    const unclaimed = data.orders.filter((order) => order.status === "ready").length;
    const deliveryActive = data.orders.filter((order) => ["pickup", "delivery"].includes(order.fulfillment) && order.status !== "completed").length;
    const activeCustomers = new Set(data.orders.filter((order) => daysBetween(order.createdAt, now) <= 30).map((order) => order.customerId)).size;
    return {
      todayOrders: todayOrders.length,
      todayRevenue: sumOrders(paidToday),
      monthRevenue: sumOrders(paidMonth),
      inProcess,
      unclaimed,
      deliveryActive,
      activeCustomers,
      topService: topServiceName(data.orders.filter((order) => isSameMonth(order.createdAt, now)))
    };
  }

  function getReport(range) {
    const now = new Date();
    const orders = data.orders.filter((order) => {
      if (range === "today") return isSameDay(order.createdAt, now);
      if (range === "week") return daysBetween(order.createdAt, now) <= 7;
      return isSameMonth(order.createdAt, now);
    });
    const paid = orders.filter((order) => order.paymentStatus === "paid");
    const unpaid = orders.filter((order) => order.paymentStatus !== "paid");
    const serviceMap = new Map();
    orders.forEach((order) => {
      const current = serviceMap.get(order.serviceId) || { name: order.serviceName, count: 0, total: 0 };
      current.count += 1;
      current.total += order.total;
      serviceMap.set(order.serviceId, current);
    });
    const services = Array.from(serviceMap.values()).sort((a, b) => b.total - a.total);
    return {
      orders: orders.length,
      revenue: sumOrders(paid),
      unpaid: sumOrders(unpaid),
      average: orders.length ? Math.round(sumOrders(orders) / orders.length) : 0,
      services: services.length ? services : data.services.map((service) => ({ name: service.name, count: 0, total: 0 }))
    };
  }

  function getFilteredOrders() {
    const search = ui.search.trim().toLowerCase();
    return data.orders
      .filter((order) => {
        if (!search) return true;
        return [order.number, order.customerName, order.phone, order.serviceName]
          .join(" ")
          .toLowerCase()
          .includes(search);
      })
      .filter((order) => {
        if (ui.orderFilter === "active") return !["ready", "completed"].includes(order.status);
        if (ui.orderFilter === "ready") return order.status === "ready";
        if (ui.orderFilter === "unpaid") return order.paymentStatus !== "paid";
        if (ui.orderFilter === "delivery") return ["pickup", "delivery"].includes(order.fulfillment);
        if (ui.orderFilter === "late") return isLate(order);
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getOrder(id) {
    return data.orders.find((order) => order.id === id);
  }

  function getCustomer(id) {
    return data.customers.find((customer) => customer.id === id);
  }

  function getSelectedClient() {
    return getCustomer(ui.selectedClientId) || data.customers[0];
  }

  function getClientOrders(customerId) {
    return data.orders.filter((order) => order.customerId === customerId);
  }

  function getStatus(id) {
    return statusFlow.find((status) => status.id === id) || statusFlow[0];
  }

  function getNextStatus(id) {
    const index = statusIndex(id);
    return statusFlow[index + 1] || null;
  }

  function statusIndex(id) {
    return Math.max(0, statusFlow.findIndex((status) => status.id === id));
  }

  function topServiceName(orders) {
    const counts = new Map();
    orders.forEach((order) => counts.set(order.serviceName, (counts.get(order.serviceName) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }

  function sumOrders(orders) {
    return orders.reduce((sum, order) => sum + order.total, 0);
  }

  function isLate(order) {
    return order.status !== "completed" && new Date(order.dueAt) < new Date();
  }

  function isSameDay(value, date) {
    const a = new Date(value);
    const b = new Date(date);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function isSameMonth(value, date) {
    const a = new Date(value);
    const b = new Date(date);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  function daysBetween(value, date) {
    const diff = new Date(date).getTime() - new Date(value).getTime();
    return diff / (1000 * 60 * 60 * 24);
  }

  function addHours(date, hours) {
    return new Date(date.getTime() + hours * 60 * 60 * 1000);
  }

  function addDays(date, days) {
    return addHours(date, days * 24);
  }

  function createId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function makeOrderNumber(sequence, dateValue = new Date()) {
    const date = new Date(dateValue);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `LA-${month}${day}-${String(sequence).padStart(3, "0")}`;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(new Date(value));
  }

  function formatShortDate(value) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  function relativeDue(value) {
    const diff = new Date(value).getTime() - Date.now();
    const absHours = Math.round(Math.abs(diff) / (1000 * 60 * 60));
    if (diff < 0) return `${absHours} jam lalu`;
    if (absHours < 1) return "kurang dari 1 jam";
    if (absHours < 24) return `${absHours} jam lagi`;
    return `${Math.round(absHours / 24)} hari lagi`;
  }

  function formatQty(order) {
    return `${Number(order.qty).toLocaleString("id-ID")} ${order.unit}`;
  }

  function paymentLabel(status) {
    return status === "paid" ? "Lunas" : "Belum bayar";
  }

  function fulfillmentLabel(value) {
    if (value === "pickup") return "Pickup";
    if (value === "delivery") return "Delivery";
    return "Antar sendiri";
  }

  function rangeLabel(range) {
    if (range === "today") return "Hari ini";
    if (range === "week") return "7 hari";
    return "Bulan ini";
  }

  function initials(name) {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function firstName(name) {
    return String(name).split(/\s+/)[0] || "Pelanggan";
  }

  function normalizePhone(phone) {
    return String(phone).replace(/\D/g, "").replace(/^62/, "0");
  }

  function toWaNumber(phone) {
    const digits = String(phone).replace(/\D/g, "");
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    return digits;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("\n", " ");
  }

  function showToast(message) {
    toastRoot.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toastRoot.innerHTML = "";
    }, 2600);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (!["http:", "https:"].includes(window.location.protocol)) return;
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();

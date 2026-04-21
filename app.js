(() => {
  const STORAGE_KEY = "laundaps.state.v1";

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
    { id: "home", label: "Home", short: "Hm" },
    { id: "create", label: "Buat", short: "Bt" },
    { id: "track", label: "Tracking", short: "Tr" },
    { id: "history", label: "Riwayat", short: "Rw" },
    { id: "profile", label: "Profil", short: "Pr" }
  ];

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
    modal: null
  };

  let data = loadState();
  if (!data) {
    data = seedData();
    saveState();
  }
  ui.selectedClientId = data.customers[0]?.id || "";
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
    app.innerHTML = `
      <main class="mobile-frame">
        ${renderTopbar()}
        ${ui.role === "owner" ? renderOwnerApp() : renderClientApp()}
      </main>
      ${renderBottomNav()}
      ${ui.role === "owner" ? '<button class="fab" type="button" data-action="open-order-form">+ Order</button>' : ""}
    `;
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
    if (ui.clientTab === "create") return renderClientCreatePage();
    if (ui.clientTab === "track") return renderClientTrackingPage();
    if (ui.clientTab === "history") return renderClientHistoryPage();
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
    const activeOrders = getClientOrders(customer.id).filter((order) => order.status !== "completed");
    return `
      <section class="client-hero">
        <div class="client-hero-row">
          <img src="assets/laundry-basket.svg" alt="LaundAps" />
          <div>
            <p>Laundry kamu, jelas statusnya.</p>
            <h2>Halo, ${escapeHtml(firstName(customer.name))}</h2>
          </div>
        </div>
        <button class="button secondary" type="button" data-action="open-client-order-form">Buat order laundry</button>
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Order aktif</h3>
            <p>Cek status tanpa perlu chat berkali-kali.</p>
          </div>
        </div>
        ${activeOrders.length ? `<div class="order-list">${activeOrders.map(renderClientOrderCard).join("")}</div>` : renderEmpty("Belum ada order aktif.")}
      </section>
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Promo kamu</h3>
            <p>Poin ${customer.points} bisa dipakai untuk diskon repeat order.</p>
          </div>
        </div>
        <div class="estimate-box">
          <span>Voucher pelanggan aktif</span>
          <strong>Diskon 10%</strong>
        </div>
      </section>
    `;
  }

  function renderClientCreatePage() {
    return `
      <section class="page-title">
        <div>
          <h2>Buat order</h2>
          <p>Pilih layanan, cek estimasi, lalu konfirmasi via outlet.</p>
        </div>
      </section>
      <section class="panel">
        <div class="empty-state">
          <img src="assets/laundry-basket.svg" alt="" />
          <strong>Order cepat dari HP</strong>
          <span>Pelanggan cukup isi layanan, jumlah, dan pilihan pickup atau delivery.</span>
          <button class="button" type="button" data-action="open-client-order-form">Mulai order</button>
        </div>
      </section>
    `;
  }

  function renderClientTrackingPage() {
    const customer = getSelectedClient();
    const orders = getClientOrders(customer.id).filter((order) => order.status !== "completed");
    const tracked = ui.trackedOrderId ? getOrder(ui.trackedOrderId) : null;
    const target = tracked || orders[0] || getClientOrders(customer.id)[0];
    return `
      <section class="page-title">
        <div>
          <h2>Tracking laundry</h2>
          <p>Status dibuat simpel supaya mudah dipahami pelanggan.</p>
        </div>
      </section>
      <form class="search-row" id="tracking-lookup-form">
        <input class="input" name="query" type="search" placeholder="Masukkan nomor invoice, contoh LA-0420-001" value="${escapeAttr(ui.trackingSearch)}" />
        <button class="button" type="submit">Cari</button>
      </form>
      ${target ? renderClientTrackingDetail(target) : `<section class="panel">${renderEmpty("Belum ada order untuk dilacak.")}</section>`}
    `;
  }

  function renderClientHistoryPage() {
    const customer = getSelectedClient();
    const orders = getClientOrders(customer.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return `
      <section class="page-title">
        <div>
          <h2>Riwayat</h2>
          <p>Invoice dan transaksi sebelumnya.</p>
        </div>
      </section>
      <section class="order-list">
        ${orders.length ? orders.map(renderClientOrderCard).join("") : renderEmpty("Belum ada riwayat order.")}
      </section>
    `;
  }

  function renderClientProfilePage() {
    const customer = getSelectedClient();
    return `
      <section class="page-title">
        <div>
          <h2>Profil pelanggan</h2>
          <p>Mode demo bisa diganti untuk melihat pengalaman pelanggan lain.</p>
        </div>
      </section>
      <section class="panel">
        <div class="field">
          <label for="client-select">Masuk sebagai</label>
          <select id="client-select" class="select" data-input="select-client">
            ${data.customers
              .map(
                (item) => `<option value="${item.id}" ${item.id === customer.id ? "selected" : ""}>${escapeHtml(item.name)} - ${escapeHtml(item.phone)}</option>`
              )
              .join("")}
          </select>
        </div>
      </section>
      <section class="panel">
        <div class="customer-row">
          <div class="avatar">${initials(customer.name)}</div>
          <div class="row-copy">
            <strong>${escapeHtml(customer.name)}</strong>
            <span>${escapeHtml(customer.phone)}</span>
          </div>
        </div>
        <div class="insight-list" style="margin-top: 12px;">
          ${renderInsight("Alamat", customer.address, "Dipakai untuk pickup dan delivery")}
          ${renderInsight("Loyalty points", customer.points, "Bisa ditukar promo")}
        </div>
      </section>
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
    return `
      <section class="timeline-card">
        <div class="sheet-body">
          <div class="panel-header">
            <div>
              <h3>${escapeHtml(order.number)}</h3>
              <p>${escapeHtml(order.serviceName)} - ${formatCurrency(order.total)}</p>
            </div>
            <span class="status-chip ${getStatus(order.status).tone}">${getStatus(order.status).client}</span>
          </div>
          ${renderClientTimeline(order)}
          <div class="estimate-box" style="margin-top: 14px;">
            <span>Estimasi selesai</span>
            <strong>${formatShortDate(order.dueAt)}</strong>
          </div>
          <div class="order-actions">
            <button class="button secondary" type="button" data-action="client-chat" data-id="${order.id}">Chat laundry</button>
            <button class="ghost-button" type="button" data-action="open-client-order" data-id="${order.id}">Invoice</button>
            <button class="ghost-button" type="button" data-action="copy-tracking-link" data-id="${order.id}">Salin link</button>
          </div>
        </div>
      </section>
    `;
  }

  function renderClientTimeline(order) {
    const steps = [
      { id: "received", label: "Order diterima", desc: "Laundry sudah masuk antrean." },
      { id: "washing", label: "Sedang dicuci", desc: "Pakaian sedang diproses." },
      { id: "ironing", label: "Sedang dirapikan", desc: "Setrika dan packing." },
      { id: "ready", label: "Siap diambil", desc: "Order siap diambil atau dikirim." },
      { id: "completed", label: "Selesai", desc: "Terima kasih sudah laundry di sini." }
    ];
    const orderIndex = statusIndex(order.status);
    return `
      <div class="timeline">
        ${steps
          .map((step, index) => {
            const threshold = statusIndex(step.id);
            const done = orderIndex >= threshold;
            const current = !done && index > 0 && orderIndex < threshold && orderIndex >= statusIndex(steps[index - 1].id);
            return `
              <div class="timeline-step ${done ? "done" : ""} ${current ? "current" : ""}">
                <div class="timeline-dot">${done ? "OK" : index + 1}</div>
                <div class="timeline-copy">
                  <strong>${step.label}</strong>
                  <span>${step.desc}</span>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
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

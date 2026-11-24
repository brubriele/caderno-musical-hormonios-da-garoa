// Ensaios & instrumentos — MVP operacional conectado à BFF Bea.
// Participantes usam identificação por aparelho (hg_device/hg_user); produção usa chave ADMIN_KEY.
const state = {
  event: null,
  eventError: false,
  user: null,
  userError: false,
  email: "",
  selectedGroup: null,
  admin: null,
  adminTab: "atual",
  adminDraft: false,
  adminLocked: true,
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const ERROR_MESSAGES = {
  SOLD_OUT_ERROR: "Este instrumento acabou de esgotar.",
  ACCESSORY_SOLD_OUT_ERROR: "Este acessório acabou de esgotar.",
  ALREADY_RESERVED_ERROR: "Este e-mail já tem uma reserva neste ensaio.",
  BOOKING_CLOSED_ERROR: "As reservas estão fechadas no momento.",
  EVENT_CHANGED_ERROR: "O ensaio mudou. Atualizamos os dados.",
  STOCK_BELOW_RESERVATIONS_ERROR: "O estoque não pode ficar abaixo das reservas atuais.",
  EVENT_CREATION_PENDING_ERROR: "O encerramento anterior ainda está sincronizando.",
  NEXT_EVENT_EXISTS_ERROR: "Já existe um próximo ensaio.",
  INVALID_PARAMETER_ERROR: "Confira os campos informados.",
  NETWORK_ERROR: "Não foi possível conectar ao servidor.",
  INTERNAL_ERROR: "O servidor não conseguiu concluir a operação.",
};
const GENERIC_ERROR = "Não foi possível concluir. Tente novamente.";

async function api(path, { method = "GET", body } = {}) {
  const options = { method, credentials: "same-origin", headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw { status: 0, key: "NETWORK_ERROR" };
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw { status: response.status, key: data?.key || "INTERNAL_ERROR", message: data?.message };
  return data;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[char]);
}
function formatDate(value) {
  if (!value) return "Data a confirmar";
  const date = new Date(value + "T12:00:00");
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date);
}
function addDays(value, days) {
  const date = value ? new Date(value + "T12:00:00") : new Date();
  if (Number.isNaN(date.getTime())) return addDays(null, days);
  date.setDate(date.getDate() + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
function isBookingOpen() { return state.event?.bookingOpen === true; }
function attendanceFor(user, eventId = state.event?.id) {
  return user?.attendances?.find((item) => !eventId || item.eventId === eventId) || null;
}
function goingAttendance(user) {
  return user?.attendances?.find((item) => item.answer === "vou" && item.sync !== "REJECTED") || null;
}
function catalogNames(event, ids = []) {
  return ids.map((id) => event?.catalog?.find((item) => item.id === id)?.name).filter(Boolean);
}
function instrumentsOf(event) {
  return (event?.groups || []).filter((group) => group.active).map((group) => ({
    group,
    item: event.catalog.find((item) => item.type === "INSTRUMENT" && item.groupIds.includes(group.id)) || null,
  })).filter((entry) => entry.item);
}
function accessoriesOf(event, groupId) {
  return (event?.catalog || []).filter((item) => item.type === "ACCESSORY" && (!item.groupIds.length || item.groupIds.includes(groupId)));
}
function setPanel(id) {
  $$(".tab").forEach((button) => button.classList.toggle("active", button.dataset.panel === id));
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === id));
  if (id === "admin") loadAdmin();
  if (id === "instruments") renderInstruments();
  if (id === "mine") renderMine();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2800);
}
async function run(button, action) {
  if (button) { button.disabled = true; button.setAttribute("aria-busy", "true"); }
  try { await action(); }
  catch (error) { await handleError(error); }
  finally {
    if (button?.isConnected) { button.disabled = false; button.removeAttribute("aria-busy"); }
  }
}
async function handleError(error) {
  const key = error?.key;
  if (key === "UNAUTHORIZED_ERROR") {
    state.admin = null;
    state.adminLocked = true;
    renderAdmin();
    openAdminLogin();
    return;
  }
  showToast(ERROR_MESSAGES[key] || GENERIC_ERROR);
  if (key === "BOOKING_CLOSED_ERROR" || key === "EVENT_CHANGED_ERROR" || key === "SOLD_OUT_ERROR" || key === "ACCESSORY_SOLD_OUT_ERROR") {
    $("#instrument-dialog")?.close();
    await loadPublic();
  }
  if (key === "NEXT_EVENT_EXISTS_ERROR" && $("#admin")?.classList.contains("active")) await loadAdmin();
}

async function loadEvent() {
  try {
    state.event = await api("/api/ensaio");
    state.eventError = false;
  } catch (error) {
    state.event = null;
    state.eventError = true;
    state.eventErrorMessage = error?.message || "";
  }
}
async function loadMine() {
  try {
    state.user = await api("/api/membros");
    state.userError = false;
    if (!state.email) state.email = "";
  } catch (error) {
    state.user = null;
    state.userError = error?.key !== "NOT_FOUND_ERROR";
  }
}
async function loadPublic() {
  await Promise.all([loadEvent(), loadMine()]);
  renderHeader();
  renderInstruments();
  renderMine();
}
function renderHeader() {
  const event = state.event;
  $("#event-date").textContent = event ? formatDate(event.date) : (state.eventError ? "Ensaio indisponível" : "Carregando ensaio…");
  $("#event-time").textContent = event?.startTime || "A definir";
  $("#event-location").textContent = event?.location || "A confirmar";
  $("#attendance-count").textContent = event?.goingCount ?? "—";
  const status = $("#event-status");
  if (status) {
    status.textContent = !event ? "SEM CONEXÃO" : isBookingOpen() ? "RESERVAS ABERTAS" : "RESERVAS FECHADAS";
    status.classList.toggle("is-open", !!event && isBookingOpen());
    status.classList.toggle("is-closed", !!event && !isBookingOpen());
  }
}
function renderInstruments() {
  const list = $("#instrument-list");
  if (!list) return;
  if (!state.event) {
    list.innerHTML = '<div class="empty-state">Não foi possível carregar o ensaio. Verifique a conexão com a infraestrutura Bea e tente novamente.<br><button class="secondary-btn" type="button" id="retry-public">Tentar novamente</button></div>';
    $("#retry-public")?.addEventListener("click", loadPublic);
    return;
  }
  if (!isBookingOpen()) {
    list.innerHTML = '<div class="empty-state">As reservas estão fechadas no momento. A produção ainda não liberou a escolha de instrumentos.</div>';
    return;
  }
  const entries = instrumentsOf(state.event);
  list.innerHTML = entries.map(({ group, item }, index) => {
    const free = item.stock?.free ?? null;
    const sold = free === 0;
    const availability = free === null ? "Disponibilidade livre" : `${free} ${free === 1 ? "disponível" : "disponíveis"}`;
    return `<article class="instrument-row">
      <div><h3>${esc(group.name)}</h3><small>Reserva vinculada ao naipe do ensaio</small></div>
      <div class="stock ${sold ? "sold" : ""}">${esc(availability)}</div>
      <button class="reserve-btn" type="button" data-group="${esc(group.id)}" ${sold ? "disabled" : ""}>${sold ? "Esgotado" : "Escolher →"}</button>
    </article>`;
  }).join("") || '<div class="empty-state">Nenhum instrumento cadastrado para este ensaio.</div>';
  list.querySelectorAll("[data-group]").forEach((button) => button.addEventListener("click", () => openInstrument(button.dataset.group)));
}
function renderMine() {
  const target = $("#my-reservation");
  if (!target) return;
  if (state.userError) {
    target.innerHTML = '<div class="empty-state">Não foi possível consultar sua reserva. Tente novamente.</div>';
    return;
  }
  const attendance = attendanceFor(state.user);
  if (!state.user || !attendance) {
    target.innerHTML = '<div class="empty-state">Você ainda não registrou presença neste ensaio. Comece pela etapa 01 — Presença.</div>';
    return;
  }
  const going = attendance.answer === "vou";
  const group = state.event?.groups?.find((item) => item.id === attendance.groupId);
  const accessories = catalogNames(state.event, attendance.supportIds);
  const maskedEmail = state.user.email || "";
  target.innerHTML = `<article class="reservation-card">
    <div><p class="eyebrow">SUA PARTICIPAÇÃO</p><h3>${esc(state.user.name)}</h3>
    <p>${esc(state.user.pronoun)} · ${esc(maskedEmail)}</p>
    <p>${going ? "Presença confirmada" : "Não vai conseguir participar"}</p>
    <p>${group ? "Instrumento: " + esc(group.name) : "Sem instrumento reservado"}</p>
    <p>${accessories.length ? "Acessórios: " + esc(accessories.join(", ")) : ""}</p></div>
    <div class="reservation-actions">
      <button class="secondary-btn" type="button" id="edit-presence">Atualizar resposta</button>
      ${going && attendance.groupId ? '<button class="secondary-btn" type="button" id="remove-instrument">Desfazer instrumento</button>' : ""}
      ${going ? '<button class="secondary-btn" type="button" id="cancel-attendance">Cancelar presença</button>' : ""}
    </div>
  </article>`;
  $("#edit-presence")?.addEventListener("click", () => setPanel("presence"));
  $("#remove-instrument")?.addEventListener("click", (event) => run(event.currentTarget, () => updateOwnAttendance("vou", null, [])));
  $("#cancel-attendance")?.addEventListener("click", (event) => {
    if (confirm("Registrar que você não vai conseguir participar deste ensaio?")) run(event.currentTarget, () => updateOwnAttendance("nao-vou", null, []));
  });
}
async function updateOwnAttendance(answer, groupId, supportIds) {
  if (!state.user) { setPanel("presence"); showToast("Confirme seus dados primeiro."); return; }
  await api("/api/membros/reservas", {
    method: "PATCH",
    body: {
      email: state.email || state.user.email || "",
      name: state.user.name,
      pronoun: state.user.pronoun,
      answer,
      groupId,
      supportIds,
      emailHash: state.user.emailHash || null,
    },
  });
  await loadPublic();
  showToast(answer === "nao-vou" ? "Resposta atualizada." : "Instrumento liberado; sua presença continua confirmada.");
}
function openInstrument(groupId) {
  if (!state.user || !goingAttendance(state.user)) {
    setPanel("presence");
    showToast("Confirme sua presença antes de escolher um instrumento.");
    return;
  }
  const group = state.event.groups.find((item) => item.id === groupId);
  if (!group) return;
  const item = state.event.catalog.find((entry) => entry.type === "INSTRUMENT" && entry.groupIds.includes(groupId));
  if (item?.stock?.free === 0) { showToast("Este instrumento acabou de esgotar."); loadPublic(); return; }
  state.selectedGroup = group;
  $("#dialog-instrument-name").textContent = group.name;
  const accessories = accessoriesOf(state.event, groupId);
  $("#dialog-accessories").innerHTML = accessories.length
    ? '<p class="eyebrow">ACESSÓRIOS DISPONÍVEIS</p>' + accessories.map((accessory) => {
      const sold = accessory.stock?.free === 0;
      const already = goingAttendance(state.user)?.supportIds?.includes(accessory.id);
      return `<label class="accessory-choice"><input type="checkbox" value="${esc(accessory.id)}" ${sold ? "disabled" : ""} ${already ? "checked" : ""}><span>${esc(accessory.name)} · ${sold ? "esgotado" : accessory.stock?.free ?? "disponível"}</span></label>`;
    }).join("")
    : '<p class="form-note">Este instrumento não tem acessórios vinculados.</p>';
  $("#instrument-feedback")?.classList.add("hidden");
  $("#instrument-dialog").showModal();
}
async function reserveInstrument(event) {
  event.preventDefault();
  if (!state.selectedGroup || !state.user) { showToast("Confirme sua presença antes de reservar."); return; }
  if (!isBookingOpen()) { $("#instrument-dialog").close(); showToast("As reservas estão fechadas."); return; }
  const current = goingAttendance(state.user);
  const supportIds = $$("#dialog-accessories input:checked").map((input) => input.value);
  const body = {
    email: state.email || state.user.email || "",
    name: state.user.name,
    pronoun: state.user.pronoun,
    answer: "vou",
    groupId: state.selectedGroup.id,
    supportIds,
    emailHash: state.user.emailHash || null,
  };
  await run($("#instrument-form button[type=submit]"), async () => {
    await api("/api/membros/reservas", { method: "POST", body });
    $("#instrument-dialog").close();
    await loadPublic();
    setPanel("mine");
    showToast(current?.groupId === body.groupId ? "Reserva atualizada." : "Instrumento reservado.");
  });
}
function confirmPresence(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = $("#email").value.trim().toLowerCase();
  const name = $("#name").value.trim();
  const pronoun = $("#pronoun").value.trim();
  const answer = String(form.get("answer") || "vou");
  if (!email || !name || !pronoun) return;
  if (answer === "vou" && !isBookingOpen()) {
    showToast("A produção ainda não abriu as reservas para este ensaio.");
    return;
  }
  const current = goingAttendance(state.user);
  const body = {
    email, name, pronoun, answer,
    groupId: answer === "vou" ? (current?.groupId ?? null) : null,
    supportIds: answer === "vou" ? (current?.supportIds ?? []) : [],
    emailHash: state.user?.emailHash || null,
  };
  run($("#presence-form button[type=submit]"), async () => {
    await api("/api/membros/reservas", { method: "POST", body });
    state.email = email;
    await loadPublic();
    $("#presence-feedback").textContent = answer === "vou"
      ? "Presença confirmada. Agora escolha seu instrumento, se precisar."
      : "Sua resposta foi registrada.";
    $("#presence-feedback").classList.remove("hidden", "error");
    setPanel(answer === "vou" ? "instruments" : "mine");
  });
}

// PRODUÇÃO: senha compartilhada temporária, validada apenas no servidor.
function openAdminLogin() {
  const dialog = $("#admin-login-dialog");
  if (dialog && !dialog.open) dialog.showModal();
}
function openAdmin() {
  // Solicita a credencial antes de chamar qualquer endpoint protegido.
  // Assim, o clique sempre produz uma resposta visível, mesmo sem sessão ativa.
  openAdminLogin();
}
async function adminLogin(event) {
  event.preventDefault();
  const password = $("#admin-password").value;
  await run($("#admin-login-submit"), async () => {
    try {
      await api("/api/admin/entrar", { method: "POST", body: { key: password } });
    } catch (error) {
      if (error.key === "UNAUTHORIZED_ERROR") {
        $("#admin-login-feedback").textContent = "Senha incorreta. Confira com a produção.";
        $("#admin-login-feedback").classList.remove("hidden");
        return;
      }
      throw error;
    }
    $("#admin-password").value = "";
    $("#admin-login-feedback").classList.add("hidden");
    $("#admin-login-dialog").close();
    state.adminLocked = false;
    // Só abre a área de gestão depois que o servidor confirmou a senha.
    // setPanel também inicia a consulta autenticada do ensaio atual.
    setPanel("admin");
  });
}
async function loadAdmin() {
  const target = $("#admin-content");
  if (!target) return;
  target.innerHTML = '<div class="empty-state">Carregando dados da produção…</div>';
  try {
    state.admin = await fetchAdmin(state.adminTab);
    state.adminLocked = false;
    renderAdmin();
  } catch (error) {
    if (error.key === "UNAUTHORIZED_ERROR") {
      state.admin = null;
      state.adminLocked = true;
      renderAdmin();
      openAdminLogin();
      return;
    }
    target.innerHTML = `<div class="empty-state">Não foi possível carregar a gestão: ${esc(ERROR_MESSAGES[error.key] || error.message || GENERIC_ERROR)}<br><button class="secondary-btn" type="button" id="retry-admin">Tentar novamente</button></div>`;
    $("#retry-admin")?.addEventListener("click", loadAdmin);
  }
}
async function fetchAdmin(tab) {
  if (tab === "atual") {
    state.adminDraft = false;
    return api("/api/admin/ensaio?posicao=atual");
  }
  try {
    state.adminDraft = false;
    return await api("/api/admin/ensaio?posicao=proximo");
  } catch (error) {
    if (error.key !== "NOT_FOUND_ERROR") throw error;
  }
  const current = await api("/api/admin/ensaio?posicao=atual");
  state.adminDraft = true;
  return { event: nextDraft(current.event), users: [] };
}
function nextDraft(event) {
  return {
    ...event,
    id: null,
    integrationId: null,
    externalPublicId: null,
    bookingOpen: false,
    goingCount: 0,
    date: addDays(event.date, 7),
    catalog: event.catalog.map((item) => ({
      ...item, stock: { ...item.stock, used: 0, free: item.stock.total },
    })),
  };
}
function eventBody(event) {
  return {
    id: event.id,
    name: event.name,
    location: event.location,
    whatsappUrl: event.whatsappUrl || null,
    date: event.date,
    startTime: event.startTime || null,
    endTime: event.endTime || null,
    categoryId: event.categoryId || null,
    description: event.description || {
      visibility: "PRIVATE", description: null, releaseAt: null, membersEarlyAt: null, totalVacancies: null,
    },
    groups: event.groups.map((group) => ({ id: group.id, name: group.name, active: group.active })),
    catalog: event.catalog.map((item) => ({
      id: item.id, name: item.name, type: item.type, groupIds: item.groupIds,
      stock: { total: item.stock.total, rotative: item.stock.rotative },
    })),
  };
}
async function updateEvent(change) {
  const body = { ...eventBody(state.admin.event), ...change };
  if (state.adminDraft) {
    const { id, ...create } = body;
    await api("/api/admin/ensaio", { method: "POST", body: create });
    state.adminDraft = false;
    state.admin = await api("/api/admin/ensaio?posicao=proximo");
  } else {
    state.admin = await api("/api/admin/ensaio", { method: "PUT", body });
  }
  renderAdmin();
  await loadPublic();
}
function renderAdmin() {
  const target = $("#admin-content");
  if (!target) return;
  if (state.adminLocked || !state.admin) {
    target.innerHTML = '<div class="empty-state">Acesso restrito. Entre com a senha da produção.<br><button class="secondary-btn" type="button" id="admin-login-open">Entrar →</button></div>';
    $("#admin-login-open")?.addEventListener("click", openAdminLogin);
    return;
  }
  const event = state.admin.event;
  const users = state.admin.users || [];
  const rows = users.map((user) => {
    const attendance = attendanceFor(user, event.id);
    if (!attendance) return null;
    const group = event.groups.find((item) => item.id === attendance.groupId);
    const accessories = catalogNames(event, attendance.supportIds);
    return { user, attendance, group, accessories };
  }).filter(Boolean);
  const going = rows.filter((row) => row.attendance.answer === "vou" && row.attendance.sync !== "REJECTED");
  const reserved = going.filter((row) => row.attendance.groupId);
  const currentTab = state.adminTab === "atual";
  const inventory = event.catalog.map((item) => ({
    ...item,
    reservations: item.type === "INSTRUMENT"
      ? reserved.filter((row) => item.groupIds.includes(row.attendance.groupId))
      : reserved.filter((row) => row.attendance.supportIds.includes(item.id)),
  }));
  target.innerHTML = `
    <div class="admin-logout"><button type="button" id="admin-logout">Sair da produção ↗</button></div>
    <div class="admin-grid">
      <article class="admin-card"><h3>PRESENÇAS CONFIRMADAS</h3><div class="big">${going.length}</div></article>
      <article class="admin-card"><h3>RESERVAS DE INSTRUMENTO</h3><div class="big">${reserved.length}</div></article>
    </div>
    ${currentTab ? `<article class="admin-card">
      <h3>DISPONIBILIDADE PARA PARTICIPANTES</h3>
      <div class="admin-status ${event.bookingOpen ? "is-open" : "is-closed"}">
        <div><strong>${event.bookingOpen ? "RESERVAS ABERTAS" : "RESERVAS FECHADAS"}</strong>
        <small>${event.bookingOpen ? "Presença e seleção de instrumentos liberadas." : "A produção ainda não liberou o formulário."}</small></div>
        <button class="primary-btn" type="button" id="toggle-booking">${event.bookingOpen ? "Fechar reservas" : "Liberar reservas"} →</button>
      </div>
    </article>` : ""}
    <article class="admin-card">
      <h3>ENSAIO ${currentTab ? "ATUAL" : "PRÓXIMO"} ${state.adminDraft ? "· RASCUNHO" : ""}</h3>
      <div class="admin-tabs">
        <button type="button" data-admin-tab="atual" class="${currentTab ? "active" : ""}">ATUAL</button>
        <button type="button" data-admin-tab="proximo" class="${currentTab ? "" : "active"}">PRÓXIMO</button>
      </div>
      <form class="admin-form" id="admin-event-form">
        <label>Data<input type="date" id="admin-date" value="${esc(event.date || "")}" required></label>
        <label>Horário<input type="time" id="admin-time" value="${esc(event.startTime || "")}"></label>
        <label>Local<input id="admin-location" value="${esc(event.location || "")}" required></label>
        <button class="primary-btn" type="submit">${state.adminDraft ? "Criar próximo ensaio" : "Salvar dados do ensaio"} →</button>
      </form>
      <p class="admin-note">${state.adminDraft ? "Este é um rascunho local no painel. Salvar cria o próximo ensaio na base operacional." : "As alterações são salvas no ambiente operacional da Bea."}</p>
    </article>
    <article class="admin-card">
      <h3>ESTOQUE E RESERVAS</h3>
      <div class="admin-stock-list">
        ${inventory.map((item) => {
          const unlimited = item.stock.total === null || item.stock.rotative;
          const free = item.stock.free === null ? "sem limite" : item.stock.free + " disponíveis";
          return `<div class="admin-stock-row">
            <div><strong>${esc(item.name)}</strong><small>${item.reservations.length} reservado(s) · ${esc(free)}</small></div>
            <div class="stock-controls">
              <button type="button" data-stock="-1" data-id="${esc(item.id)}" ${unlimited ? "disabled" : ""}>−</button>
              <strong>${unlimited ? "—" : esc(item.stock.total)}</strong>
              <button type="button" data-stock="1" data-id="${esc(item.id)}" ${unlimited ? "disabled" : ""}>+</button>
            </div>
          </div>`;
        }).join("")}
      </div>
    </article>
    <article class="admin-card">
      <h3>PRESENÇAS E RESERVAS</h3>
      <div class="admin-attendance-list">
        ${rows.map(({ user, attendance, group, accessories }) => `<div class="admin-attendance-row">
          <div><strong>${esc(user.name)}</strong><small>${esc(user.pronoun)} · ${esc(user.email || "")}</small></div>
          <div class="attendance-detail">${attendance.answer === "vou" ? "Presença confirmada" : "Não vai ao ensaio"} · ${group ? esc(group.name) : "sem instrumento"}${accessories.length ? " · " + esc(accessories.join(", ")) : ""}</div>
        </div>`).join("") || '<div class="empty-state">Nenhuma resposta registrada para este ensaio.</div>'}
      </div>
      <p class="admin-note">Nesta versão a produção consulta as respostas e administra estoque e ensaio. Cancelamentos individuais são feitos pela própria pessoa; a API Bea ainda não oferece uma ação administrativa específica para cancelar uma presença individual.</p>
    </article>
    ${currentTab ? '<div class="admin-actions"><button class="danger" type="button" id="advance-event">Encerrar ensaio e ativar o próximo</button></div>' : ""}
  `;
  $("#admin-logout")?.addEventListener("click", logoutAdmin);
  $("#toggle-booking")?.addEventListener("click", (event) => run(event.currentTarget, toggleBooking));
  $("#admin-event-form")?.addEventListener("submit", saveAdminEvent);
  $("#advance-event")?.addEventListener("click", (event) => run(event.currentTarget, advanceEvent));
  target.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => setAdminTab(button.dataset.adminTab)));
  target.querySelectorAll("[data-stock]").forEach((button) => button.addEventListener("click", () => run(button, () => adjustStock(button.dataset.id, Number(button.dataset.stock)))));
}
async function setAdminTab(tab) {
  if (tab === state.adminTab) return;
  state.adminTab = tab;
  state.admin = null;
  await loadAdmin();
}
async function saveAdminEvent(event) {
  event.preventDefault();
  const change = {
    date: $("#admin-date").value,
    startTime: $("#admin-time").value || null,
    location: $("#admin-location").value.trim(),
  };
  if (!change.date || !change.location) { showToast("Informe data e local do ensaio."); return; }
  await run(event.submitter, async () => {
    await updateEvent(change);
    showToast(state.adminDraft ? "Próximo ensaio criado." : "Ensaio atualizado.");
  });
}
async function toggleBooking() {
  const isActive = !state.admin.event.bookingOpen;
  const event = await api("/api/admin/reservas", { method: "PUT", body: { isActive } });
  state.admin.event = event;
  renderAdmin();
  await loadPublic();
  showToast(isActive ? "Reservas liberadas." : "Reservas fechadas.");
}
async function adjustStock(id, delta) {
  const item = state.admin.event.catalog.find((entry) => entry.id === id);
  if (!item || item.stock.total === null || item.stock.rotative) return;
  const total = Math.max(0, item.stock.total + delta);
  if (!item.stock.rotative && total < item.stock.used) {
    showToast("O estoque não pode ficar abaixo das reservas atuais.");
    return;
  }
  const catalog = eventBody(state.admin.event).catalog.map((entry) => entry.id === id
    ? { ...entry, stock: { ...entry.stock, total } } : entry);
  await updateEvent({ catalog });
}
async function advanceEvent() {
  if (!confirm("Encerrar o ensaio atual e ativar o próximo? As presenças e reservas ficam associadas ao ensaio encerrado.")) return;
  await api("/api/admin/ensaio/proximo", { method: "POST" });
  state.adminTab = "atual";
  await loadAdmin();
  await loadPublic();
  showToast("Próximo ensaio ativado. As reservas começam fechadas.");
}
async function logoutAdmin() {
  await run($("#admin-logout"), async () => {
    await api("/api/admin/sair", { method: "POST" });
    state.admin = null;
    state.adminLocked = true;
    renderAdmin();
    showToast("Sessão da produção encerrada.");
  });
}

function init() {
  $$(".tab").forEach((button) => button.addEventListener("click", () => setPanel(button.dataset.panel)));
  $("#presence-form")?.addEventListener("submit", (event) => run($("#presence-form button[type=submit]"), () => confirmPresence(event)));
  $("#instrument-form")?.addEventListener("submit", reserveInstrument);
  $("#close-dialog")?.addEventListener("click", () => $("#instrument-dialog").close());
  $("#open-admin")?.addEventListener("click", openAdmin);
  $("#admin-login-form")?.addEventListener("submit", adminLogin);
  $("#close-admin-login")?.addEventListener("click", () => $("#admin-login-dialog").close());
  loadPublic();
}
init();

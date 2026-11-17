(function () {
  "use strict";
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  // UTM: берём из адреса, храним в сессии, чтобы не потерять при переходе по страницам
  function readUtm() {
    var params = new URLSearchParams(location.search), saved = {};
    try { saved = JSON.parse(sessionStorage.getItem("utm") || "{}"); } catch (e) { saved = {}; }
    UTM.forEach(function (k) { if (params.get(k)) saved[k] = params.get(k); });
    try { sessionStorage.setItem("utm", JSON.stringify(saved)); } catch (e) {}
    return saved;
  }
  var utm = readUtm();

  // Анкета-диагностика
  document.querySelectorAll(".quiz").forEach(function (quiz) {
    var steps = quiz.querySelectorAll(".quiz-step");
    var back = quiz.querySelector(".quiz-back"), next = quiz.querySelector(".quiz-next");
    var final = quiz.querySelector(".quiz-final"), nav = quiz.querySelector(".quiz-nav");
    var i = 0;
    function show() {
      steps.forEach(function (s, n) { s.classList.toggle("active", n === i); });
      back.hidden = i === 0;
    }
    function answers() {
      var out = [];
      steps.forEach(function (s) {
        var c = s.querySelector("input:checked");
        out.push(s.querySelector("legend").textContent.replace(/^\d+ из \d+\.\s*/, "") + ": " + (c ? c.value : "нет ответа"));
      });
      return out.join("; ");
    }
    next.addEventListener("click", function () {
      if (i < steps.length - 1) { i++; show(); return; }
      steps.forEach(function (s) { s.classList.remove("active"); });
      nav.hidden = true; final.hidden = false;
      var f = final.querySelector("form");
      if (f) f.querySelector('[name="answers"]').value = answers();
    });
    steps.forEach(function (s) {
      s.addEventListener("change", function () { if (i < steps.length - 1) { i++; show(); } });
    });
    back.addEventListener("click", function () { if (i > 0) { i--; show(); } });
    show();
  });

  // Формы
  document.querySelectorAll(".lead-form").forEach(function (form) {
    UTM.forEach(function (k) { var el = form.querySelector('[name="' + k + '"]'); if (el && utm[k]) el.value = utm[k]; });
    form.querySelector('[name="page"]').value = location.pathname;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      var q = function (n) { return form.querySelector('[name="' + n + '"]'); };
      if (q("website").value) return; // ловушка для ботов
      var phone = (q("phone").value || "").replace(/\D/g, "");
      if (!q("name").value.trim()) { status.textContent = "Напишите, как к вам обращаться."; return; }
      if (phone.length < 10) { status.textContent = "Проверьте номер телефона."; return; }
      if (!q("consent").checked) { status.textContent = "Без согласия на обработку данных отправить заявку нельзя."; return; }
      var endpoint = form.getAttribute("data-endpoint") || "";
      if (!/^https:\/\//.test(endpoint)) {
        status.textContent = "Это прототип: заявка не отправлена, приём заявок ещё не подключён.";
        return;
      }
      var body = new FormData(form);
      status.textContent = "Отправляем...";
      fetch(endpoint, { method: "POST", body: body })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          status.textContent = "Заявка принята. Мы свяжемся с вами в рабочее время.";
        })
        .catch(function () { status.textContent = "Не получилось отправить. Напишите в Telegram или MAX."; });
    });
  });

  // Мобильное меню: закрываем по клику снаружи, по Escape и по ссылке
  var menu = document.querySelector("details.menu");
  if (menu) {
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); } });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
  }

  // Заглушки [УТОЧНИТЬ] в прототипе подсвечиваем
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var hits = [], node;
  while ((node = walker.nextNode())) if (node.nodeValue.indexOf("[УТОЧНИТЬ") !== -1) hits.push(node);
  hits.forEach(function (t) {
    var span = document.createElement("span");
    span.className = "todo";
    span.textContent = t.nodeValue;
    t.parentNode.replaceChild(span, t);
  });
})();

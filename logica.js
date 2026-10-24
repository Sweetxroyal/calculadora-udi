const NOTA_MINIMA = 3.0;
const NOTA_MAXIMA = 5.0;
// Se aprueba con más de 2.95 (2.96 sube a 3.0, pero 2.95 no).
// Las notas con sus pesos dan múltiplos de 0.005, así que el mínimo real es 2.955
const LIMITE_REDONDEO = 2.955;

// Cada campo: [id, peso, etiqueta]
const cortes = [
    { nombre: "primer corte", campos: [["taller1", 0.05, "Taller 1"], ["quiz1", 0.05, "Quiz 1"], ["parcial1", 0.20, "Parcial 1"]] },
    { nombre: "segundo corte", campos: [["taller2", 0.05, "Taller 2"], ["quiz2", 0.05, "Quiz 2"], ["parcial2", 0.20, "Parcial 2"]] },
    { nombre: "tercer corte", campos: [["taller3", 0.05, "Taller 3"], ["quiz3", 0.05, "Quiz 3"], ["parcial3", 0.30, "Parcial 3"]] }
];

// Guarda los datos para poder generar otras opciones
let estadoOpciones = null;

function redondear(valor) {
    return Math.ceil(valor * 10 - 0.5 - 1e-9) / 10;
}

// Entero aleatorio entre min y max (incluidos)
function aleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function mostrarSituacion(html, clase) {
    let situacion = document.getElementById("situacion");
    situacion.innerHTML = html;
    situacion.className = "situacion " + clase;
}

// Lee un campo: vacío, error o valor válido
function leerCampo(id, nombreCorte) {
    let texto = document.getElementById(id).value.trim();
    if (texto === "") {
        return { vacio: true };
    }
    let valor = parseFloat(texto);
    if (isNaN(valor)) {
        return { error: "Ingresa solo números (revisa el " + nombreCorte + ")." };
    }
    if (valor < 0 || valor > NOTA_MAXIMA) {
        return { error: "Las notas deben estar entre 0.0 y 5.0 (revisa el " + nombreCorte + ")." };
    }
    return { valor: valor };
}

// ---------- Cálculo de un solo corte ----------
function calcularCorte(i) {
    let mensajeError = document.getElementById("mensajeError");
    let salida = document.getElementById("resCorte" + i);
    mensajeError.textContent = "";
    salida.style.display = "none";

    let corte = cortes[i];
    let puntos = 0;
    let pesoIngresado = 0;
    let pesoCorte = 0;
    let faltan = 0;

    for (let j = 0; j < corte.campos.length; j++) {
        let peso = corte.campos[j][1];
        pesoCorte += peso;
        let lectura = leerCampo(corte.campos[j][0], corte.nombre);

        if (lectura.error) {
            mensajeError.textContent = lectura.error;
            return;
        }
        if (lectura.vacio) {
            faltan++;
        } else {
            puntos += lectura.valor * peso;
            pesoIngresado += peso;
        }
    }

    if (pesoIngresado === 0) {
        mensajeError.textContent = "Ingresa al menos una nota del " + corte.nombre + ".";
        return;
    }

    let maximo = NOTA_MAXIMA * pesoCorte;
    if (faltan === 0) {
        let nota = redondear(puntos / pesoCorte);
        salida.textContent = "Nota del " + corte.nombre + ": " + nota.toFixed(1) +
            " de 5.0. Aporta " + puntos.toFixed(2) + " de " + maximo.toFixed(2) + " puntos a la definitiva.";
    } else {
        let promedio = redondear(puntos / pesoIngresado);
        let textoFaltan = faltan === 1 ? "falta 1 nota" : "faltan " + faltan + " notas";
        salida.textContent = "Llevas " + puntos.toFixed(2) + " de " + maximo.toFixed(2) +
            " puntos. Promedio de lo ingresado: " + promedio.toFixed(1) + " (" + textoFaltan + ").";
    }
    salida.style.display = "block";
}

// ---------- Opciones aleatorias para aprobar ----------
function totalPuntos(combo, faltantes) {
    let total = 0;
    for (let k = 0; k < faltantes.length; k++) {
        total += (combo[k] / 10) * faltantes[k].peso;
    }
    return total;
}

// Crea una combinación (notas en décimas, 0 a 50) que alcance los puntos necesarios
function generarCombinacion(faltantes, necesarios, promedioMinimo) {
    let piso = Math.max(0, Math.round((promedioMinimo - 1) * 10));
    let techo = Math.min(50, Math.round(promedioMinimo * 10));
    let combo = [];

    for (let k = 0; k < faltantes.length; k++) {
        combo.push(aleatorio(piso, techo));
    }

    let intentos = 0;
    while (totalPuntos(combo, faltantes) < necesarios - 1e-9 && intentos < 5000) {
        let k = aleatorio(0, faltantes.length - 1);
        if (combo[k] < 50) {
            combo[k]++;
        }
        intentos++;
    }
    return combo;
}

// Genera hasta 3 combinaciones distintas
function generarOpciones(e) {
    let opciones = [];
    let claves = [];
    let intentos = 0;

    while (opciones.length < 3 && intentos < 100) {
        let combo = generarCombinacion(e.faltantes, e.necesarios, e.promedioMinimo);
        let clave = combo.join(",");
        if (claves.indexOf(clave) === -1) {
            claves.push(clave);
            opciones.push(combo);
        }
        intentos++;
    }
    return opciones;
}

function mostrarOpciones() {
    let e = estadoOpciones;
    let opciones = generarOpciones(e);
    let lista = "";

    for (let o = 0; o < opciones.length; o++) {
        let partes = [];
        for (let k = 0; k < e.faltantes.length; k++) {
            partes.push(e.faltantes[k].etiqueta + ": <strong>" + (opciones[o][k] / 10).toFixed(1) + "</strong>");
        }
        let definitiva = redondear(e.acumulado + totalPuntos(opciones[o], e.faltantes));
        lista += "<li>" + partes.join(" · ") + " → definitiva " + definitiva.toFixed(1) + "</li>";
    }

    let titulo = opciones.length > 1
        ? "Para aprobar puedes lograr cualquiera de estas combinaciones:"
        : "Para aprobar necesitas esta combinación:";

    let promedioNecesario = Math.ceil(e.promedioMinimo * 10 - 1e-9) / 10;
    mostrarSituacion("Te falta el " + e.porcentaje + "% de la nota. Necesitas un promedio mínimo de <strong>" + promedioNecesario.toFixed(1) + "</strong> en lo que falta. " + titulo + "<ul>" + lista + "</ul>", "pendiente");
    document.getElementById("btnOtras").style.display = opciones.length > 1 ? "block" : "none";
}

// ---------- Cálculo general ----------
function calcular() {
    let mensajeError = document.getElementById("mensajeError");
    let resultados = document.getElementById("resultados");

    mensajeError.textContent = "";
    resultados.style.display = "none";
    document.getElementById("btnOtras").style.display = "none";
    estadoOpciones = null;

    let acumulado = 0;
    let pesoFaltante = 0;
    let faltantes = [];
    let aportes = [];
    let notasIngresadas = 0;

    for (let i = 0; i < cortes.length; i++) {
        let aporteCorte = 0;

        for (let j = 0; j < cortes[i].campos.length; j++) {
            let id = cortes[i].campos[j][0];
            let peso = cortes[i].campos[j][1];
            let etiqueta = cortes[i].campos[j][2];
            let lectura = leerCampo(id, cortes[i].nombre);

            if (lectura.error) {
                mensajeError.textContent = lectura.error;
                return;
            }
            if (lectura.vacio) {
                pesoFaltante += peso;
                faltantes.push({ peso: peso, etiqueta: etiqueta });
            } else {
                aporteCorte += lectura.valor * peso;
                notasIngresadas++;
            }
        }

        aportes.push(aporteCorte);
        acumulado += aporteCorte;
    }

    if (notasIngresadas === 0) {
        mensajeError.textContent = "Ingresa al menos una nota para calcular.";
        return;
    }

    document.getElementById("notaCorte1").textContent = aportes[0].toFixed(2) + " de 1.50";
    document.getElementById("notaCorte2").textContent = aportes[1].toFixed(2) + " de 1.50";
    document.getElementById("notaCorte3").textContent = aportes[2].toFixed(2) + " de 2.00";

    if (pesoFaltante === 0) {
        // Todas las notas completas
        let definitiva = redondear(acumulado);
        document.getElementById("etiquetaDefinitiva").textContent = "Nota definitiva:";
        document.getElementById("definitiva").textContent = definitiva.toFixed(1);

        if (definitiva >= NOTA_MINIMA) {
            mostrarSituacion("¡Aprobado! Tu definitiva es " + definitiva.toFixed(1) + ".", "aprobado");
        } else {
            mostrarSituacion("Reprobado. Tu definitiva es " + definitiva.toFixed(1) + ".", "reprobado");
        }
    } else {
        // Faltan notas
        document.getElementById("etiquetaDefinitiva").textContent = "Acumulado hasta ahora:";
        document.getElementById("definitiva").textContent = acumulado.toFixed(2) + " de 5.00";

        let necesarios = LIMITE_REDONDEO - acumulado;
        let promedioMinimo = necesarios / pesoFaltante;
        let porcentaje = Math.round(pesoFaltante * 100);

        if (necesarios <= 0) {
            mostrarSituacion("Ya tienes la nota para aprobar, aunque saques 0.0 en lo que falta.", "aprobado");
        } else if (promedioMinimo > NOTA_MAXIMA) {
            mostrarSituacion("Aunque saques 5.0 en lo que falta (" + porcentaje + "%), ya no alcanzas 3.0.", "reprobado");
        } else {
            estadoOpciones = {
                acumulado: acumulado,
                faltantes: faltantes,
                necesarios: necesarios,
                promedioMinimo: promedioMinimo,
                porcentaje: porcentaje
            };
            mostrarOpciones();
        }
    }

    resultados.style.display = "block";
    resultados.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function limpiar() {
    for (let i = 0; i < cortes.length; i++) {
        for (let j = 0; j < cortes[i].campos.length; j++) {
            document.getElementById(cortes[i].campos[j][0]).value = "";
        }
        document.getElementById("resCorte" + i).style.display = "none";
    }
    document.getElementById("mensajeError").textContent = "";
    document.getElementById("resultados").style.display = "none";
    document.getElementById("btnOtras").style.display = "none";
    estadoOpciones = null;
}

// Eventos
document.getElementById("btnCalcular").addEventListener("click", calcular);
document.getElementById("btnLimpiar").addEventListener("click", limpiar);
document.getElementById("btnOtras").addEventListener("click", function () {
    if (estadoOpciones !== null) {
        mostrarOpciones();
    }
});

let botonesCorte = document.querySelectorAll(".btn-corte");
for (let b = 0; b < botonesCorte.length; b++) {
    botonesCorte[b].addEventListener("click", function () {
        calcularCorte(parseInt(botonesCorte[b].getAttribute("data-corte")));
    });
}

// Enter dentro de un campo calcula la definitiva
let todosLosCampos = document.querySelectorAll("input");
for (let c = 0; c < todosLosCampos.length; c++) {
    todosLosCampos[c].addEventListener("keydown", function (evento) {
        if (evento.key === "Enter") {
            calcular();
        }
    });
}

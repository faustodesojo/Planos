const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("color");
const grosorPicker = document.getElementById("grosor");
const figuraSelect = document.getElementById("figura");
const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const addTextBtn = document.getElementById("addTextBtn");
const imageInput = document.getElementById("imageInput");

let dibujando = false;
let historial = [];
let figura = "libre";
let inicioX, inicioY;
let imgTemporal;
let imgObj = null;
let imgStartX, imgStartY, imgWidth, imgHeight;
let isResizing = false;
let resizeHandleSize = 10; // Tamaño del área de ajuste de tamaño

// Guardar estado inicial
guardarHistorial();

// Eventos para dibujar
canvas.addEventListener("mousedown", (e) => {
    dibujando = true;
    inicioX = e.offsetX;
    inicioY = e.offsetY;

    if (figura === "libre") {
        ctx.beginPath();
        ctx.moveTo(inicioX, inicioY);
    } else {
        imgTemporal = ctx.getImageData(0, 0, canvas.width, canvas.height); // Guarda el estado antes de dibujar
    }

    // Detectar si se hace clic sobre la imagen
    if (imgObj) {
        let imgRight = imgStartX + imgWidth;
        let imgBottom = imgStartY + imgHeight;
        if (
            e.offsetX >= imgStartX && e.offsetX <= imgRight &&
            e.offsetY >= imgStartY && e.offsetY <= imgBottom
        ) {
            // Iniciar movimiento de la imagen
            isResizing = false;
            offsetX = e.offsetX - imgStartX;
            offsetY = e.offsetY - imgStartY;
        } else {
            // Detectar si se hace clic sobre la esquina para redimensionar
            if (e.offsetX >= imgRight - resizeHandleSize && e.offsetX <= imgRight &&
                e.offsetY >= imgBottom - resizeHandleSize && e.offsetY <= imgBottom) {
                isResizing = true;
                offsetX = e.offsetX - imgRight;
                offsetY = e.offsetY - imgBottom;
            }
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!dibujando) return;

    let x = e.offsetX;
    let y = e.offsetY;

    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = grosorPicker.value;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    restaurarHistorial(); // Recupera la última imagen antes de empezar el trazo

    if (figura === "libre") {
        ctx.lineTo(x, y);
        ctx.stroke();
    } else {
        ctx.putImageData(imgTemporal, 0, 0); // Restaura antes de dibujar la figura

        if (figura === "linea") {
            ctx.beginPath();
            ctx.moveTo(inicioX, inicioY);
            ctx.lineTo(x, y);
            ctx.stroke();
        } else if (figura === "rectangulo") {
            ctx.strokeRect(inicioX, inicioY, x - inicioX, y - inicioY);
        } else if (figura === "circulo") {
            let radio = Math.sqrt((x - inicioX) ** 2 + (y - inicioY) ** 2);
            ctx.beginPath();
            ctx.arc(inicioX, inicioY, radio, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Si se está moviendo o redimensionando la imagen
    if (imgObj && (offsetX || offsetY)) {
        if (isResizing) {
            imgWidth = e.offsetX - imgStartX + offsetX;
            imgHeight = e.offsetY - imgStartY + offsetY;
            redrawCanvas();
        } else {
            imgStartX = e.offsetX - offsetX;
            imgStartY = e.offsetY - offsetY;
            redrawCanvas();
        }
    }
});

canvas.addEventListener("mouseup", () => {
    if (dibujando) {
        dibujando = false;
        guardarHistorial(); // Guardar solo cuando termina de dibujar
        ctx.beginPath();
    }

    // Finalizar movimiento/redimensionamiento de imagen
    offsetX = offsetY = null;
});

// Guardar el estado del canvas
function guardarHistorial() {
    historial.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

// Restaurar el último estado
function restaurarHistorial() {
    if (historial.length > 0) {
        ctx.putImageData(historial[historial.length - 1], 0, 0);
    }
}

// Deshacer último trazo
undoBtn.addEventListener("click", () => {
    if (historial.length > 1) {
        historial.pop();
        ctx.putImageData(historial[historial.length - 1], 0, 0);
    }
});

// Limpiar canvas
clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historial = [];
    guardarHistorial();
});

// Guardar imagen
saveBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "plano.png";
    link.href = canvas.toDataURL();
    link.click();
});

// Cambiar tipo de figura
figuraSelect.addEventListener("change", (e) => {
    figura = e.target.value;
});

addTextBtn.addEventListener("click", () => {
    agregandoTexto = true;
});

canvas.addEventListener("click", (e) => {
    if (agregandoTexto) {
        let texto = prompt("Ingrese el texto:");
        if (texto) {
            textos.push({
                text: texto,
                x: e.offsetX,
                y: e.offsetY,
            });
            dibujarTextos();
            guardarHistorial();
        }
        agregandoTexto = false;
    }
});

// Dibujar los textos en el canvas
function dibujarTextos() {
    restaurarHistorial();
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    textos.forEach((t) => {
        ctx.fillText(t.text, t.x, t.y);
    });
}

// Detectar si se hace clic en un texto para moverlo
canvas.addEventListener("mousedown", (e) => {
    textos.forEach((t) => {
        let medida = ctx.measureText(t.text);
        if (
            e.offsetX >= t.x &&
            e.offsetX <= t.x + medida.width &&
            e.offsetY >= t.y - 16 &&
            e.offsetY <= t.y
        ) {
            textoSeleccionado = t;
            offsetX = e.offsetX - t.x;
            offsetY = e.offsetY - t.y;
        }
    });
});

// Mover el texto mientras se arrastra
canvas.addEventListener("mousemove", (e) => {
    if (textoSeleccionado) {
        textoSeleccionado.x = e.offsetX - offsetX;
        textoSeleccionado.y = e.offsetY - offsetY;
        dibujarTextos();
    }
});

// Soltar el texto
canvas.addEventListener("mouseup", () => {
    if (textoSeleccionado) {
        textoSeleccionado = null;
        guardarHistorial();
    }
});

// Activar la carga de la imagen al hacer clic en el botón
document.getElementById("insertImageBtn").addEventListener("click", () => {
    document.getElementById("imageInput").click();
});

// Insertar la imagen
imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function () {
                imgObj = img;
                imgStartX = canvas.width / 2 - img.width / 2; // Inicia centrado
                imgStartY = canvas.height / 2 - img.height / 2;
                imgWidth = img.width;
                imgHeight = img.height;
                redrawCanvas();
            };
        };
        reader.readAsDataURL(file);
    }
});

// Redibujar el canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    restaurarHistorial();
    if (imgObj) {
        ctx.drawImage(imgObj, imgStartX, imgStartY, imgWidth, imgHeight);
    }
}

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("color");
const grosorPicker = document.getElementById("grosor");
const figuraSelect = document.getElementById("figura");
const undoBtn = document.getElementById("undoBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");
const addTextBtn = document.getElementById("addTextBtn");
const insertImageBtn = document.getElementById("insertImageBtn");
const imageInput = document.getElementById("imageInput");

let dibujando = false;
let historial = [];
let textos = [];
let figura = "libre";
let imgObj = null;
let imgStartX, imgStartY, imgWidth, imgHeight;
let isResizing = false;
let isMoving = false;
let addingText = false;
let offsetX, offsetY;
let rotationAngle = 0; // Ángulo de rotación en radianes
const resizeHandleSize = 10; // Tamaño del área de ajuste de la imagen

// Guardar estado inicial
guardarHistorial();

// Cambiar la figura seleccionada sin errores
figuraSelect.addEventListener("change", (e) => {
    figura = e.target.value;
    dibujando = false; // Evitar trazos incorrectos al cambiar de figura
});

// Evento para activar el modo de agregar texto
addTextBtn.addEventListener("click", () => {
    addingText = true;
});

// Evento para agregar texto en cualquier parte del canvas
canvas.addEventListener("click", (e) => {
    if (addingText) {
        let texto = prompt("Ingrese el texto:");
        if (texto) {
            textos.push({
                text: texto,
                x: e.offsetX,
                y: e.offsetY,
            });
            redrawCanvas();
            guardarHistorial();
        }
        addingText = false;
    }
});

// Dibujar textos en el canvas
function dibujarTextos() {
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    textos.forEach((t) => {
        ctx.fillText(t.text, t.x, t.y);
    });
}

// Eventos de dibujo y manipulación de imágenes
canvas.addEventListener("mousedown", (e) => {
    inicioX = e.offsetX;
    inicioY = e.offsetY;

    // Verificar si se hace clic en la imagen
    if (imgObj) {
        let imgRight = imgStartX + imgWidth;
        let imgBottom = imgStartY + imgHeight;

        // Verificar si se hace clic en el handle de redimensionamiento (esquina inferior derecha)
        if (
            inicioX >= imgRight - resizeHandleSize &&
            inicioX <= imgRight &&
            inicioY >= imgBottom - resizeHandleSize &&
            inicioY <= imgBottom
        ) {
            isResizing = true;
            return;
        }

        // Verificar si se hace clic en el handle de rotación (esquina superior izquierda)
        let rotateHandleX = imgStartX + resizeHandleSize / 2;
        let rotateHandleY = imgStartY + resizeHandleSize / 2;
        if (
            inicioX >= rotateHandleX - resizeHandleSize &&
            inicioX <= rotateHandleX + resizeHandleSize &&
            inicioY >= rotateHandleY - resizeHandleSize &&
            inicioY <= rotateHandleY + resizeHandleSize
        ) {
            // Rotar la imagen 90 grados (π/2 radianes) por cada clic
            rotationAngle += Math.PI / 2;
            redrawCanvas();
            return;
        }

        // Verificar si se hace clic en la imagen para moverla
        if (
            inicioX >= imgStartX &&
            inicioX <= imgRight &&
            inicioY >= imgStartY &&
            inicioY <= imgBottom
        ) {
            isMoving = true;
            offsetX = inicioX - imgStartX;
            offsetY = inicioY - imgStartY;
            return;
        }
    }

    if (figura !== "libre") {
        dibujando = true;
    } else {
        ctx.beginPath();
        ctx.moveTo(inicioX, inicioY);
        dibujando = true; // Asegurar que el dibujo libre esté activo
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (isResizing) {
        imgWidth = Math.max(e.offsetX - imgStartX, 20);
        imgHeight = Math.max(e.offsetY - imgStartY, 20);
        redrawCanvas();
        return;
    }

    if (isMoving) {
        imgStartX = e.offsetX - offsetX;
        imgStartY = e.offsetY - offsetY;
        redrawCanvas();
        return;
    }

    if (!dibujando) return;

    let x = e.offsetX;
    let y = e.offsetY;

    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = grosorPicker.value;

    if (figura === "libre") {
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (figura === "linea") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        restaurarHistorial();
        ctx.beginPath();
        ctx.moveTo(inicioX, inicioY);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (figura === "rectangulo") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        restaurarHistorial();
        ctx.strokeRect(inicioX, inicioY, x - inicioX, y - inicioY);
    } else if (figura === "circulo") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        restaurarHistorial();
        let radio = Math.sqrt((x - inicioX) ** 2 + (y - inicioY) ** 2);
        ctx.beginPath();
        ctx.arc(inicioX, inicioY, radio, 0, Math.PI * 2);
        ctx.stroke();
    }
});

canvas.addEventListener("mouseup", () => {
    if (dibujando) {
        dibujando = false;
        guardarHistorial();
        ctx.beginPath();
    }
    isMoving = false;
    isResizing = false;
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

// Redibujar todo el canvas
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    restaurarHistorial();

    if (imgObj) {
        ctx.save();
        ctx.translate(imgStartX + imgWidth / 2, imgStartY + imgHeight / 2);
        ctx.rotate(rotationAngle);
        ctx.drawImage(imgObj, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        ctx.restore();

        // Dibujar el handle de rotación (círculo azul en la esquina superior izquierda)
        ctx.beginPath();
        ctx.arc(imgStartX + resizeHandleSize / -52, imgStartY + resizeHandleSize / -52, resizeHandleSize, 0, Math.PI * 2);
        ctx.fillStyle = "transparent";
        ctx.fill();

        // Dibujar el handle de redimensionamiento (cuadrado rojo en la esquina inferior derecha)
        ctx.fillStyle = "transparent"; 
        ctx.fillRect(
            imgStartX + imgWidth - resizeHandleSize,
            imgStartY + imgHeight - resizeHandleSize,
            resizeHandleSize,
            resizeHandleSize
        );
    }

    dibujarTextos();
}

// Insertar la imagen
insertImageBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function () {
                imgObj = img;
                imgStartX = 50;
                imgStartY = 50;
                imgWidth = 100;
                imgHeight = 100;
                rotationAngle = 0; // Reiniciar el ángulo de rotación
                redrawCanvas();
            };
        };
        reader.readAsDataURL(file);
    }
});

// Guardar imagen final (sin los handles de rotación y redimensionamiento)
saveBtn.addEventListener("click", () => {
    // Crear un canvas temporal para dibujar el contenido sin los handles
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Dibujar el contenido del canvas original en el temporal
    tempCtx.drawImage(canvas, 0, 0);

    // Si hay una imagen, dibujarla sin los handles
    if (imgObj) {
        tempCtx.save();
        tempCtx.translate(imgStartX + imgWidth / 2, imgStartY + imgHeight / 2);
        tempCtx.rotate(rotationAngle);
        tempCtx.drawImage(imgObj, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        tempCtx.restore();
    }

    // Dibujar los textos en el canvas temporal
    tempCtx.fillStyle = "black";
    tempCtx.font = "16px Arial";
    textos.forEach((t) => {
        tempCtx.fillText(t.text, t.x, t.y);
    });

 // Guardar el canvas temporal como imagen BMP
const link = document.createElement("a");
link.download = "plano.bmp";
link.href = canvas.toDataURL("image/bmp");
link.click();

});

// Deshacer último trazo
undoBtn.addEventListener("click", () => {
    if (historial.length > 1) {
        historial.pop(); // Eliminar el último estado del historial
        textos.pop(); // Eliminar el último texto agregado
        restaurarHistorial(); // Restaurar el estado anterior
    }
});

// Limpiar canvas con confirmación
clearBtn.addEventListener("click", () => {
    const confirmar = confirm("¿Estás seguro de que deseas limpiar todo el plano?");
    if (confirmar) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        historial = [];
        textos = [];
        imgObj = null;
        guardarHistorial();
    }
});
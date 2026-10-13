from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Flowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
SCREENSHOT_DIR = ROOT / "docs" / "assets" / "screenshots"
OUT = ROOT / "output" / "pdf" / "manual-grafico-inventario-metas-peru.pdf"

BLUE = colors.HexColor("#0b63f6")
BLUE_DARK = colors.HexColor("#123a72")
GREEN = colors.HexColor("#12844c")
INK = colors.HexColor("#17233c")
MUTED = colors.HexColor("#627089")
LIGHT = colors.HexColor("#f4f7fb")
LINE = colors.HexColor("#dbe3ef")
ORANGE = colors.HexColor("#e96a1a")


class HeaderCanvas:
    def __init__(self, canvas, doc):
        self.canvas = canvas
        self.doc = doc

    def draw(self):
        c = self.canvas
        page = c.getPageNumber()
        w, h = self.doc.pagesize
        if page == 1:
            return
        c.saveState()
        c.setStrokeColor(LINE)
        c.line(1.2 * cm, h - 1.1 * cm, w - 1.2 * cm, h - 1.1 * cm)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(BLUE_DARK)
        c.drawString(1.2 * cm, h - 0.75 * cm, "Sistema de Inventario METAS PERU")
        c.setFont("Helvetica", 8)
        c.setFillColor(MUTED)
        c.drawRightString(w - 1.2 * cm, 0.65 * cm, f"Pagina {page}")
        c.restoreState()


class RoundedBox(Flowable):
    def __init__(self, title, body, color=BLUE, width=5.8 * cm, height=2.6 * cm):
        super().__init__()
        self.title = title
        self.body = body
        self.color = color
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(colors.white)
        c.setStrokeColor(LINE)
        c.roundRect(0, 0, self.width, self.height, 8, fill=1, stroke=1)
        c.setFillColor(self.color)
        c.roundRect(0.25 * cm, self.height - 0.65 * cm, 0.33 * cm, 0.33 * cm, 3, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(0.72 * cm, self.height - 0.55 * cm, self.title)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 8)
        text = self.body
        y = self.height - 1.1 * cm
        for line in wrap_text(text, 42):
            c.drawString(0.35 * cm, y, line)
            y -= 0.34 * cm
        c.restoreState()


class FlowArrow(Flowable):
    def __init__(self, labels, width=25 * cm, height=2.4 * cm):
        super().__init__()
        self.labels = labels
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        c.saveState()
        gap = 0.25 * cm
        box_w = (self.width - gap * (len(self.labels) - 1)) / len(self.labels)
        y = 0.35 * cm
        for i, label in enumerate(self.labels):
            x = i * (box_w + gap)
            c.setFillColor(LIGHT)
            c.setStrokeColor(LINE)
            c.roundRect(x, y, box_w, 1.25 * cm, 8, fill=1, stroke=1)
            c.setFillColor(BLUE if i % 2 == 0 else GREEN)
            c.circle(x + 0.42 * cm, y + 0.63 * cm, 0.16 * cm, fill=1, stroke=0)
            c.setFillColor(INK)
            c.setFont("Helvetica-Bold", 8)
            for j, line in enumerate(wrap_text(label, 18)[:2]):
                c.drawString(x + 0.75 * cm, y + 0.78 * cm - j * 0.32 * cm, line)
            if i < len(self.labels) - 1:
                ax = x + box_w + 0.03 * cm
                c.setStrokeColor(BLUE)
                c.line(ax, y + 0.63 * cm, ax + gap - 0.08 * cm, y + 0.63 * cm)
                c.line(ax + gap - 0.08 * cm, y + 0.63 * cm, ax + gap - 0.2 * cm, y + 0.75 * cm)
                c.line(ax + gap - 0.08 * cm, y + 0.63 * cm, ax + gap - 0.2 * cm, y + 0.51 * cm)
        c.restoreState()


def wrap_text(text, chars):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        if len(line) + len(word) + 1 > chars:
            lines.append(line)
            line = word
        else:
            line = f"{line} {word}".strip()
    if line:
        lines.append(line)
    return lines


def styles():
    ss = getSampleStyleSheet()
    ss.add(
        ParagraphStyle(
            name="TitleWhite",
            parent=ss["Title"],
            textColor=colors.white,
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=32,
            alignment=TA_LEFT,
        )
    )
    ss.add(
        ParagraphStyle(
            name="SubWhite",
            parent=ss["Normal"],
            textColor=colors.HexColor("#dbeafe"),
            fontSize=12,
            leading=17,
        )
    )
    ss.add(
        ParagraphStyle(
            name="H1",
            parent=ss["Heading1"],
            textColor=BLUE_DARK,
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=23,
            spaceAfter=8,
        )
    )
    ss.add(
        ParagraphStyle(
            name="H2",
            parent=ss["Heading2"],
            textColor=INK,
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            spaceBefore=8,
            spaceAfter=5,
        )
    )
    ss.add(
        ParagraphStyle(
            name="Body",
            parent=ss["BodyText"],
            textColor=INK,
            fontSize=9,
            leading=13,
            spaceAfter=6,
        )
    )
    ss.add(
        ParagraphStyle(
            name="Muted",
            parent=ss["BodyText"],
            textColor=MUTED,
            fontSize=8,
            leading=11,
            spaceAfter=4,
        )
    )
    ss.add(
        ParagraphStyle(
            name="Center",
            parent=ss["BodyText"],
            textColor=INK,
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
        )
    )
    return ss


def screenshot(name, width=16 * cm, height=8.8 * cm):
    path = SCREENSHOT_DIR / name
    img = Image(str(path))
    img._restrictSize(width, height)
    return img


def section_page(title, intro, image_name=None, bullets=None):
    ss = styles()
    story = [Paragraph(title, ss["H1"]), Paragraph(intro, ss["Body"])]
    if image_name:
        story += [Spacer(1, 0.15 * cm), screenshot(image_name, 24 * cm, 10.2 * cm), Spacer(1, 0.15 * cm)]
    if bullets:
        data = []
        for item in bullets:
            data.append([Paragraph(f"<b>{item[0]}</b>", ss["Body"]), Paragraph(item[1], ss["Body"])])
        table = Table(data, colWidths=[5.0 * cm, 18.0 * cm], hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                    ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(table)
    story.append(PageBreak())
    return story


def card_grid(items):
    rows = []
    for i in range(0, len(items), 3):
        row = []
        for title, body, color in items[i : i + 3]:
            row.append(RoundedBox(title, body, color=color))
        while len(row) < 3:
            row.append("")
        rows.append(row)
    table = Table(rows, colWidths=[6.1 * cm, 6.1 * cm, 6.1 * cm], hAlign="LEFT")
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    return table


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    ss = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=landscape(A4),
        rightMargin=1.2 * cm,
        leftMargin=1.2 * cm,
        topMargin=1.35 * cm,
        bottomMargin=1.0 * cm,
        title="Manual grafico del Sistema de Inventario METAS PERU",
    )
    story = []

    # Cover.
    cover = Table(
        [
            [
                Paragraph("Sistema de Inventario<br/>METAS PERU", ss["TitleWhite"]),
                Paragraph(
                    "Manual grafico para cliente<br/><br/>Conteo Pocket, dashboard, cruce de inventario, reportes, chat y rendimiento en tiempo real.",
                    ss["SubWhite"],
                ),
            ]
        ],
        colWidths=[13 * cm, 11 * cm],
        rowHeights=[16 * cm],
    )
    cover.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE_DARK),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 1.0 * cm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 1.0 * cm),
            ]
        )
    )
    story += [cover, PageBreak()]

    story += [
        Paragraph("Resumen ejecutivo", ss["H1"]),
        Paragraph(
            "El sistema de inventario METAS PERU centraliza el conteo fisico, la validacion contra stock, la comunicacion con usuarios Pocket y la generacion de reportes para auditoria.",
            ss["Body"],
        ),
        card_grid(
            [
                ("Pocket", "Registro de escaneos desde celular o lector, con modo online y modo manual.", BLUE),
                ("Dashboard", "Monitoreo de avance, totales, filtros, acciones y exportacion.", GREEN),
                ("Cruce", "Comparacion entre stock de tienda y conteo fisico con diferencias.", ORANGE),
                ("Reportes", "Exportacion Excel con diferencias, codigos no reconocidos y resumen.", BLUE),
                ("Chat", "Mensajes entre administradores y usuarios Pocket por socket.", GREEN),
                ("Rendimiento", "Medicion por Pocket: escaneos, unidades, tiempo y subzonas.", ORANGE),
            ]
        ),
        Spacer(1, 0.2 * cm),
        Paragraph("Flujo general", ss["H2"]),
        FlowArrow(["Crear sesion", "Asignar subzonas", "Escanear", "Sincronizar", "Cruzar inventario", "Exportar reporte"]),
        PageBreak(),
    ]

    story += section_page(
        "Dashboard de inventario",
        "Pantalla de control usada por administradores y auditores para revisar avance, filtros, acciones operativas y exportaciones.",
        "dashboard-inventario.png",
        [
            ("Totales", "Stock, conteo, diferencias y SKUs unicos se muestran en cards superiores."),
            ("Acciones", "Importar inventario, eliminar subzona, ver estadisticas, rendimiento, socket monitor, chat y exportar Excel."),
            ("Tabla", "Los registros se muestran paginados y con filtros por columna para evitar carga innecesaria en el navegador."),
        ],
    )

    story += section_page(
        "Filtros y calculos",
        "Los filtros consultan al servidor y actualizan solo los valores filtrados. Los totales principales se mantienen como valores globales.",
        "filtros-dashboard.png",
        [
            ("Filtro exacto", "Cuando se busca una subzona como M10, no debe incluir M100 ni M101."),
            ("Servidor", "La paginacion, filtros y resumen deben resolverse desde backend para grandes volumenes."),
            ("Diferencia", "La diferencia se calcula como conteo menos stock."),
        ],
    )

    story += section_page(
        "Pocket principal",
        "Vista mobile para usuarios de conteo. Permite seleccionar sesion, modo de funcionamiento, tipo de registro, subzona y registrar escaneos.",
        "pocket-principal.png",
        [
            ("Modo online", "Sincroniza automaticamente si existe conexion."),
            ("Modo manual", "Guarda los escaneos como pendientes para revisar y enviar luego."),
            ("Unidades", "Muestra enviados, pendientes y unidades contadas antes de sincronizar."),
        ],
    )

    story += section_page(
        "Pendientes Pocket",
        "Vista de control local para registros que aun no fueron confirmados por el servidor.",
        "pocket-pendientes.png",
        [
            ("Edicion", "En modo manual se puede editar cantidad o eliminar antes de sincronizar."),
            ("Sincronizacion", "El boton sincronizar envia el lote y limpia solo lo confirmado."),
            ("Memoria local", "Los pendientes viven en IndexedDB hasta que el servidor confirme."),
        ],
    )

    story += section_page(
        "Chat y notificaciones",
        "El chat permite comunicacion entre dashboard y usuarios Pocket para coordinar correcciones durante el conteo.",
        "chat-mobile.png",
        [
            ("Tiempo real", "Los mensajes se emiten por socket al usuario destino."),
            ("Mobile", "El panel se adapta a pantallas pequenas y mantiene controles visibles."),
            ("Notificacion", "Puede mostrar badge, resaltar chat minimizado y reproducir sonido al llegar un mensaje."),
        ],
    )

    story += section_page(
        "Rendimiento por Pocket",
        "Reporte para analizar productividad por usuario, secciones trabajadas y tiempos de conteo.",
        "rendimiento-pocket.png",
        [
            ("Esc/h", "Escaneos por hora se calcula con escaneos * 3600 / segundos transcurridos."),
            ("Tiempo activo", "Estima intervalos reales de trabajo, descartando pausas largas."),
            ("Detalle", "El detalle debe mostrar zona y subzona con nombre legible."),
        ],
    )

    story += section_page(
        "Monitor de sockets",
        "Herramienta tecnica para administradores que permite diagnosticar interacciones en tiempo real.",
        "monitor-sockets.png",
        [
            ("Acceso", "Debe verlo solo el rol administrador."),
            ("Metricas", "Conexiones, eventos, salas, usuarios autenticados y actividad reciente."),
            ("Uso", "Sirve para validar chat, dashboard en vivo y eventos de sincronizacion."),
        ],
    )

    story += [
        Paragraph("Arquitectura funcional", ss["H1"]),
        Paragraph("El sistema combina frontend web/mobile, API REST, sockets, MySQL e IndexedDB local para soportar conteo en campo con red variable.", ss["Body"]),
        card_grid(
            [
                ("Frontend", "Angular/Ionic. Pantallas de Pocket, dashboard, configuracion y reportes.", BLUE),
                ("API Inventario", "Node.js/Express. Conteos, cruces, reportes, mantenimiento y chat.", GREEN),
                ("Auth", "Login, sesion y validacion de token JWT.", ORANGE),
                ("MySQL", "Sesiones, usuarios, inventario de tienda, escaneos, subzonas y mensajes.", BLUE),
                ("IndexedDB", "Pendientes locales del Pocket y soporte a red inestable.", GREEN),
                ("Socket.io", "Actualizacion en vivo, chat y monitor de eventos.", ORANGE),
            ]
        ),
        Paragraph("Proceso clave: sincronizacion sin duplicados", ss["H2"]),
        FlowArrow(["Escaneo local", "client_scan_id", "Enviar lote", "Validar recibo", "Insertar solo nuevos", "Confirmar al Pocket"]),
        PageBreak(),
    ]

    story += [
        Paragraph("Checklist para entrega al cliente", ss["H1"]),
        Paragraph("Antes de una demostracion o puesta en produccion, validar los siguientes puntos.", ss["Body"]),
        Table(
            [
                ["Area", "Validacion"],
                ["Login", "Usuario administrador, auditor y Pocket ingresan correctamente."],
                ["Pocket", "Modo online, modo manual, pendientes, historial y sincronizacion funcionan."],
                ["Dashboard", "Cards, filtros, paginacion y exportacion responden con datos completos."],
                ["Cruce", "Stock, conteo, diferencia y codigos no reconocidos cuadran con el informe."],
                ["Chat", "Mensaje dashboard a Pocket y Pocket a dashboard llega por socket."],
                ["Rendimiento", "Se muestran usuario, zona, subzona, tiempos y escaneos por hora."],
                ["Soporte", "Logs, monitor de sockets y PM2 disponibles para diagnostico."],
            ],
            colWidths=[4 * cm, 20 * cm],
            hAlign="LEFT",
            style=[
                ("BACKGROUND", (0, 0), (-1, 0), BLUE_DARK),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ],
        ),
        Spacer(1, 0.5 * cm),
        Paragraph("Documentacion complementaria", ss["H2"]),
        Paragraph("El repositorio tambien incluye manual de usuario, manual tecnico, base de datos, procesos, diagramas, despliegue, soporte y API backend en la carpeta docs.", ss["Body"]),
    ]

    def on_page(canvas, doc_obj):
        HeaderCanvas(canvas, doc_obj).draw()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(OUT)


if __name__ == "__main__":
    build()

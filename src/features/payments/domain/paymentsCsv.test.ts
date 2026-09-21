import { describe, expect, it } from "vitest"
import { buildPaymentsCsv, csvFilename, type CsvLabels, type CsvPaymentRow } from "./paymentsCsv"

const rows: CsvPaymentRow[] = [
  { payment_date: "2026-09-01", client: "Tita Diseño", project: "Rebranding", amount: 150000, method: "transferencia", status: "pagado", notes: "Seña" },
  { payment_date: "2026-09-15", client: "Pepe", project: 'Logo "final"', amount: 12500.5, method: "efectivo", status: "pendiente", notes: "línea 1\nlínea 2" },
]

const labels: CsvLabels = {
  header: ["Fecha", "Cliente", "Proyecto", "Monto", "Método", "Estado", "Notas"],
  method: { transferencia: "Transferencia", efectivo: "Efectivo", tarjeta: "Tarjeta", other: "Otro" },
  status: { pagado: "Pagado", pendiente: "Pendiente" },
}

describe("buildPaymentsCsv", () => {
  it("starts with a UTF-8 BOM so Excel reads accents, and uses ';' + decimal comma for Spanish (es-AR Excel)", () => {
    const csv = buildPaymentsCsv(rows, { lang: "es", labels })
    const lines = csv.split("\r\n")

    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(lines[0]).toBe("﻿Fecha;Cliente;Proyecto;Monto;Método;Estado;Notas")
    expect(lines[1]).toBe("2026-09-01;Tita Diseño;Rebranding;150000;Transferencia;Pagado;Seña")
    expect(lines[2]).toBe('2026-09-15;Pepe;"Logo ""final""";12500,5;Efectivo;Pendiente;"línea 1\nlínea 2"')
  })

  it("uses ',' + decimal point for English", () => {
    const csv = buildPaymentsCsv(rows, { lang: "en", labels })
    const lines = csv.split("\r\n")

    expect(lines[0]).toBe("﻿Fecha,Cliente,Proyecto,Monto,Método,Estado,Notas")
    expect(lines[2]).toBe('2026-09-15,Pepe,"Logo ""final""",12500.5,Efectivo,Pendiente,"línea 1\nlínea 2"')
  })

  it("leaves empty cells for missing date/client/project/notes and never throws on them", () => {
    const csv = buildPaymentsCsv([{ amount: 10, method: "other", status: "pendiente" }], { lang: "es", labels })

    expect(csv.split("\r\n")[1]).toBe(";;;10;Otro;Pendiente;")
  })
})

describe("csvFilename", () => {
  it("names the file by scope and period", () => {
    expect(csvFilename("month", "2026-09")).toBe("clientflow-pagos-2026-09.csv")
    expect(csvFilename("year", "2026-09")).toBe("clientflow-pagos-2026.csv")
  })
})

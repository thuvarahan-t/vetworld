package com.vetworld.VetWorld.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.vetworld.VetWorld.model.Order;
import com.vetworld.VetWorld.model.OrderItem;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;


@Service
public class ReceiptPdfService {

    private static final DeviceRgb VET_BLUE = new DeviceRgb(26, 115, 232);
    private static final DeviceRgb VET_BLUE_LIGHT = new DeviceRgb(232, 240, 254);
    private static final DeviceRgb GREY_TEXT = new DeviceRgb(71, 85, 105);
    private static final DeviceRgb GREEN = new DeviceRgb(13, 158, 110);
    private static final DeviceRgb RED = new DeviceRgb(239, 68, 68);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Parse JSON address {"line1":"...","line2":"...","district":"..."} -> readable string */
    private String formatAddress(String raw) {
        if (raw == null || raw.isBlank()) return "";
        try {
            JsonNode node = MAPPER.readTree(raw);
            List<String> parts = new ArrayList<>();
            if (node.hasNonNull("line1") && !node.get("line1").asText().isBlank())
                parts.add(node.get("line1").asText());
            if (node.hasNonNull("line2") && !node.get("line2").asText().isBlank())
                parts.add(node.get("line2").asText());
            if (node.hasNonNull("district") && !node.get("district").asText().isBlank())
                parts.add(node.get("district").asText());
            return String.join(", ", parts);
        } catch (Exception e) {
            return raw; // fallback: plain text
        }
    }


    public byte[] generateReceipt(Order order) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);
        document.setMargins(40, 50, 40, 50);

        PdfFont boldFont = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
        PdfFont regularFont = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA);

        // ── Header: VetWorld branding ────────────────────────────────────
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Left: Brand name
        Cell brandCell = new Cell().setBorder(Border.NO_BORDER).setPaddingBottom(10);
        brandCell.add(new Paragraph("VetWorld")
                .setFont(boldFont).setFontSize(24).setFontColor(VET_BLUE));
        brandCell.add(new Paragraph("Veterinary & Lab Equipment")
                .setFont(regularFont).setFontSize(10).setFontColor(GREY_TEXT));
        headerTable.addCell(brandCell);

        // Right: Receipt label
        Cell receiptLabelCell = new Cell().setBorder(Border.NO_BORDER)
                .setPaddingBottom(10).setTextAlignment(TextAlignment.RIGHT);
        receiptLabelCell.add(new Paragraph("ORDER RECEIPT")
                .setFont(boldFont).setFontSize(16).setFontColor(GREY_TEXT));
        receiptLabelCell.add(new Paragraph("#" + order.getOrderNumber())
                .setFont(boldFont).setFontSize(13).setFontColor(VET_BLUE));
        headerTable.addCell(receiptLabelCell);
        document.add(headerTable);

        // Divider line
        document.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(2f)).setMarginTop(10));
        document.add(new Paragraph("\n"));

        // ── Order Status Banner ──────────────────────────────────────────
        DeviceRgb statusColor = switch (order.getStatus()) {
            case CONFIRMED -> GREEN;
            case PROCESSING, PACKED -> VET_BLUE;
            case DELIVERED -> GREEN;
            case CANCELLED -> RED;
            case REFUNDED -> GREEN;
            case PAYMENT_REVIEW -> VET_BLUE;
            default -> GREY_TEXT;
        };
        String statusLabel = switch (order.getStatus()) {
            case PENDING_PAYMENT   -> "PAYMENT PENDING";
            case PAYMENT_FAILED    -> "✕ PAYMENT FAILED";
            case PAYMENT_CANCELLED -> "✕ PAYMENT CANCELLED";
            case PAYMENT_REVIEW    -> "⏳ AWAITING PAYMENT REVIEW";
            case CONFIRMED         -> "✓ ORDER CONFIRMED";
            case PROCESSING        -> "⚙ PROCESSING";
            case PACKED            -> "📦 PACKED";
            case DELIVERED         -> "✓ DELIVERED";
            case CANCELLED         -> "✕ CANCELLED";
            case REFUNDED          -> "✓ REFUNDED";
        };
        document.add(new Paragraph(statusLabel)
                .setFont(boldFont).setFontSize(11).setFontColor(statusColor)
                .setBackgroundColor(VET_BLUE_LIGHT).setPadding(8)
                .setTextAlignment(TextAlignment.CENTER));
        document.add(new Paragraph("\n"));

        // ── Order & Customer Info ────────────────────────────────────────
        Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Left: Order Info
        Cell orderInfoCell = new Cell().setBorder(Border.NO_BORDER);
        orderInfoCell.add(new Paragraph("ORDER INFORMATION")
                .setFont(boldFont).setFontSize(9).setFontColor(GREY_TEXT));
        orderInfoCell.add(new Paragraph(order.getOrderNumber())
                .setFont(boldFont).setFontSize(12).setFontColor(ColorConstants.BLACK));
        orderInfoCell.add(new Paragraph("Date: " + order.getCreatedAt()
                .format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")))
                .setFont(regularFont).setFontSize(10).setFontColor(GREY_TEXT));
        if (order.getDeliveryDate() != null) {
            orderInfoCell.add(new Paragraph("Expected Delivery: " +
                    order.getDeliveryDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")))
                    .setFont(regularFont).setFontSize(10).setFontColor(GREY_TEXT));
        }
        infoTable.addCell(orderInfoCell);

        // Right: Customer Info
        Cell customerCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
        customerCell.add(new Paragraph("DELIVERY TO")
                .setFont(boldFont).setFontSize(9).setFontColor(GREY_TEXT));
        customerCell.add(new Paragraph(order.getCustomerName())
                .setFont(boldFont).setFontSize(12).setFontColor(ColorConstants.BLACK));
        customerCell.add(new Paragraph(order.getCustomerPhone())
                .setFont(regularFont).setFontSize(10).setFontColor(GREY_TEXT));
        customerCell.add(new Paragraph(formatAddress(order.getDeliveryAddress()))
                .setFont(regularFont).setFontSize(10).setFontColor(GREY_TEXT));
        infoTable.addCell(customerCell);
        document.add(infoTable);
        document.add(new Paragraph("\n"));

        // ── Items Table ──────────────────────────────────────────────────
        Table itemsTable = new Table(UnitValue.createPercentArray(new float[]{4, 1, 2, 2}))
                .setWidth(UnitValue.createPercentValue(100));

        // Header row
        String[] headers = {"Product", "Qty", "Unit Price", "Total"};
        for (String h : headers) {
            itemsTable.addHeaderCell(new Cell()
                    .setBackgroundColor(VET_BLUE).setPadding(8)
                    .add(new Paragraph(h).setFont(boldFont).setFontSize(10)
                            .setFontColor(ColorConstants.WHITE))
                    .setBorder(Border.NO_BORDER));
        }

        // Data rows
        boolean alt = false;
        for (OrderItem item : order.getItems()) {
            DeviceRgb rowBg = alt ? VET_BLUE_LIGHT : new DeviceRgb(255, 255, 255);
            alt = !alt;

            itemsTable.addCell(new Cell().setBackgroundColor(rowBg).setPadding(7).setBorder(Border.NO_BORDER)
                    .add(new Paragraph(item.getProductName()).setFont(boldFont).setFontSize(10))
                    .add(new Paragraph(item.getTypeName()).setFont(regularFont).setFontSize(9).setFontColor(GREY_TEXT)));

            itemsTable.addCell(new Cell().setBackgroundColor(rowBg).setPadding(7).setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.CENTER)
                    .add(new Paragraph(String.valueOf(item.getQuantity())).setFont(regularFont).setFontSize(10)));

            itemsTable.addCell(new Cell().setBackgroundColor(rowBg).setPadding(7).setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .add(new Paragraph("Rs. " + item.getUnitPrice().toPlainString()).setFont(regularFont).setFontSize(10)));

            itemsTable.addCell(new Cell().setBackgroundColor(rowBg).setPadding(7).setBorder(Border.NO_BORDER)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .add(new Paragraph("Rs. " + item.getLineTotal().toPlainString()).setFont(boldFont).setFontSize(10)));
        }

        // Total row
        itemsTable.addCell(new Cell(1, 3).setBorder(Border.NO_BORDER).setPadding(8)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(new Paragraph("GRAND TOTAL").setFont(boldFont).setFontSize(11)));
        itemsTable.addCell(new Cell().setBackgroundColor(VET_BLUE).setBorder(Border.NO_BORDER).setPadding(8)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(new Paragraph("Rs. " + order.getTotalAmount().toPlainString())
                        .setFont(boldFont).setFontSize(12).setFontColor(ColorConstants.WHITE)));

        document.add(itemsTable);

        // ── Footer ───────────────────────────────────────────────────────
        document.add(new Paragraph("\n\n"));
        document.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(1f)).setMarginTop(10));
        document.add(new Paragraph("Thank you for shopping with VetWorld!")
                .setFont(boldFont).setFontSize(10).setFontColor(VET_BLUE)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(8));
        document.add(new Paragraph("For support, contact us at support@vetworld.com")
                .setFont(regularFont).setFontSize(9).setFontColor(GREY_TEXT)
                .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }
}

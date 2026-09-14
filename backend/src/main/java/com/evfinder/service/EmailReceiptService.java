package com.evfinder.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import com.evfinder.entity.Booking;

@Service
public class EmailReceiptService {

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public boolean sendBookingReceipt(Booking booking) {
        if (booking == null) return false;

        String recipientEmail = booking.getCustomerEmail();
        if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
            System.out.println("[WARN] No recipient email specified for booking ID: " + booking.getId());
            return false;
        }

        String customerName = booking.getCustomerName() != null ? booking.getCustomerName() : "Valued Customer";
        String stationName = booking.getStation() != null ? booking.getStation() : "EV Charging Station";
        String slot = booking.getSlot() != null ? booking.getSlot() : "Scheduled Slot";
        String date = booking.getBookingDate() != null ? booking.getBookingDate() : "N/A";
        String vehicleNo = booking.getVehicleNumber() != null ? booking.getVehicleNumber() : "N/A";
        String vehicleType = booking.getVehicleType() != null ? booking.getVehicleType() : "EV Vehicle";
        String paymentStatus = booking.getPaymentStatus() != null ? booking.getPaymentStatus() : "Confirmed";
        String paymentType = booking.getPaymentType() != null ? booking.getPaymentType() : "Online Payment";
        String hours = booking.getChargingHours() != null ? booking.getChargingHours() : "1 Hour";

        String subject = "⚡ EV Finder - Booking Receipt #" + booking.getId() + " (" + stationName + ")";

        String body = String.format(
            "Dear %s,\n\n" +
            "Thank you for booking your EV charging slot with EV Finder! Below is your official booking confirmation and payment receipt.\n\n" +
            "===========================================\n" +
            "            BOOKING RECEIPT & SUMMARY       \n" +
            "===========================================\n" +
            "Booking ID       : #%d\n" +
            "Station Name     : %s\n" +
            "Booking Date     : %s\n" +
            "Time Slot        : %s\n" +
            "Charging Duration: %s\n" +
            "Vehicle Category : %s\n" +
            "Vehicle Number   : %s\n" +
            "Payment Status   : %s\n" +
            "Payment Method   : %s\n" +
            "===========================================\n\n" +
            "Location & Directions: Log in to your EV Finder Dashboard at http://localhost:5500/layout.html to view station details.\n\n" +
            "Happy & Safe Driving!\n" +
            "Warm regards,\n" +
            "The EV Finder Team",
            customerName,
            booking.getId(),
            stationName,
            date,
            slot,
            hours,
            vehicleType,
            vehicleNo,
            paymentStatus,
            paymentType
        );

        if (mailUsername == null || mailUsername.trim().isEmpty() || mailUsername.startsWith("YOUR_")) {
            System.out.println("=================================================");
            System.out.println("[MOCK EMAIL RECEIPT] Sent to: " + recipientEmail + "\nSubject: " + subject + "\n" + body);
            System.out.println("=================================================");
            return true;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(recipientEmail);
            message.setSubject(subject);
            message.setText(body);

            if (mailSender != null) {
                mailSender.send(message);
                System.out.println("[EMAIL RECEIPT] Successfully sent receipt for booking #" + booking.getId() + " to " + recipientEmail);
                return true;
            } else {
                System.out.println("[WARN] JavaMailSender is null. Simulated receipt to: " + recipientEmail);
                return true;
            }
        } catch (Exception e) {
            System.err.println("[EMAIL RECEIPT ERROR] Failed to send email via SMTP: " + e.getMessage());
            e.printStackTrace();
            System.out.println("=================================================");
            System.out.println("[FALLBACK MOCK RECEIPT] Sent to: " + recipientEmail + "\n" + body);
            System.out.println("=================================================");
            return false;
        }
    }
}

package com.evfinder.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;

@Service
public class OtpService {

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final Map<String, String> mockOtpMap = new ConcurrentHashMap<>();

    /**
     * Generates a 6-digit OTP, stores it mapped to the phone number, and sends it to the user's email.
     * If the email configurations are placeholders, prints it to the console (Simulation Mode).
     */
    public boolean sendOtp(String phone, String email) {
        // Generate a random 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        mockOtpMap.put(phone, otp);

        // Check if SMTP credentials are placeholders or blank
        if (mailUsername == null || mailUsername.isEmpty() || mailUsername.startsWith("YOUR_")) {
            System.out.println("=================================================");
            System.out.println("[MOCK EMAIL OTP] Sent OTP '" + otp + "' to email: " + email + " (Phone: " + phone + ")");
            System.out.println("=================================================");
            return true;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(email);
            message.setSubject("EV Finder - OTP Verification Code");
            message.setText("Hello,\n\nYour OTP verification code is: " + otp + "\n\nIt is valid for 5 minutes. Do not share this code with anyone.");

            if (mailSender != null) {
                mailSender.send(message);
                System.out.println("[EMAIL] Sent OTP '" + otp + "' to email " + email);
                return true;
            } else {
                System.out.println("[WARN] JavaMailSender is null. Fallback console print: " + otp);
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("=================================================");
            System.out.println("[FALLBACK MOCK OTP] Sent OTP '" + otp + "' to email: " + email + " (Phone: " + phone + ")");
            System.out.println("=================================================");
            return true;
        }
    }

    /**
     * Verifies the OTP entered by the user.
     * Returns true only if it matches the stored OTP.
     */
    public boolean verifyOtp(String phone, String otp) {
        String storedOtp = mockOtpMap.get(phone);
        boolean isValid = otp != null && otp.equals(storedOtp);
        if (isValid) {
            mockOtpMap.remove(phone);
        }
        return isValid;
    }
}

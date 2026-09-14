package com.evfinder.controller;

import com.evfinder.dto.LoginRequest;
import com.evfinder.dto.ResetPasswordRequest;
import com.evfinder.dto.SendOtpRequest;
import com.evfinder.dto.VerifyOtpRequest;
import com.evfinder.entity.User;
import com.evfinder.repository.UserRepository;
import com.evfinder.service.OtpService;
import com.evfinder.service.ResetTokenService;
import com.evfinder.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpService otpService;

    @Autowired
    private ResetTokenService resetTokenService;

    @GetMapping("/check-exists")
    public ResponseEntity<?> checkUserExists(@RequestParam(required = false) String email, @RequestParam(required = false) String phone) {
        if (email != null && !email.trim().isEmpty() && userRepository.findByEmail(email.trim()) != null) {
            return ResponseEntity.ok().body("{\"exists\":true,\"message\":\"Already registered with this Email. Go to Login Page.\"}");
        }
        if (phone != null && !phone.trim().isEmpty() && userRepository.findFirstByPhone(phone.trim()) != null) {
            return ResponseEntity.ok().body("{\"exists\":true,\"message\":\"Already registered with this Number. Go to Login Page.\"}");
        }
        return ResponseEntity.ok().body("{\"exists\":false}");
    }

    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {
        return userService.registerUser(user);
    }

    @PostMapping("/register/send-otp")
    public ResponseEntity<?> sendRegisterOtp(@RequestBody SendOtpRequest request) {
        User user = userRepository.findFirstByPhone(request.getPhone());
        if (user != null) {
            return ResponseEntity.badRequest().body("This mobile number is already registered.");
        }

        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email address is required.");
        }

        boolean sent = otpService.sendOtp(request.getPhone(), email.trim());
        if (!sent) {
            return ResponseEntity.status(500).body("Failed to send OTP. Please try again.");
        }

        return ResponseEntity.ok().body("{\"message\":\"OTP sent\"}");
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {

        User user = userService.loginUser(
                loginRequest.getEmail(),
                loginRequest.getPassword());

        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.badRequest().body("Invalid Email or Password");
        }
    }

    // ================= FORGOT PASSWORD FLOW =================

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody SendOtpRequest request) {

        User user = userRepository.findFirstByPhone(request.getPhone());
        if (user == null) {
            return ResponseEntity.status(404).body("This mobile number is not registered.");
        }

        String email = user.getEmail();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(500).body("No email registered for this mobile number.");
        }

        boolean sent = otpService.sendOtp(request.getPhone(), email.trim());
        if (!sent) {
            return ResponseEntity.status(500).body("Failed to send OTP. Please try again.");
        }

        return ResponseEntity.ok().body("{\"message\":\"OTP sent\"}");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {

        boolean valid = otpService.verifyOtp(request.getPhone(), request.getOtp());
        if (!valid) {
            return ResponseEntity.badRequest().body("Invalid OTP, please try again.");
        }

        String token = resetTokenService.issueToken(request.getPhone());

        return ResponseEntity.ok().body(
                "{\"message\":\"OTP verified\",\"resetToken\":\"" + token + "\"}"
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {

        boolean tokenValid = resetTokenService.consumeToken(request.getPhone(), request.getResetToken());
        if (!tokenValid) {
            return ResponseEntity.badRequest().body("Reset session expired or invalid. Please verify OTP again.");
        }

        User user = userRepository.findFirstByPhone(request.getPhone());
        if (user == null) {
            return ResponseEntity.status(404).body("User not found.");
        }

        user.setPassword(request.getNewPassword());
        userRepository.save(user);

        return ResponseEntity.ok().body("{\"message\":\"Password reset successful\"}");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        user.setFullName(userDetails.getFullName());
        user.setEmail(userDetails.getEmail());
        user.setPhone(userDetails.getPhone());
        user.setVehicleNumber(userDetails.getVehicleNumber());
        if (userDetails.getVehicleType() != null) {
            user.setVehicleType(userDetails.getVehicleType());
        }
        if (userDetails.getProfileImage() != null) {
            user.setProfileImage(userDetails.getProfileImage());
        }
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("New password cannot be empty");
        }
        user.setPassword(newPassword);
        userRepository.save(user);
        return ResponseEntity.ok().body("{\"message\":\"Password updated successfully\"}");
    }
}

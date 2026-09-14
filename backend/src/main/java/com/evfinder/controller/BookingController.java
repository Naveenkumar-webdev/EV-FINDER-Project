package com.evfinder.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;

import com.evfinder.entity.Booking;
import com.evfinder.repository.BookingRepository;
import com.evfinder.entity.Station;
import com.evfinder.repository.StationRepository;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private com.evfinder.service.EmailReceiptService emailReceiptService;

    // ✅ GET all bookings
    @GetMapping
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ✅ GET booking by ID
    @GetMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> getBookingById(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return org.springframework.http.ResponseEntity.status(404).body("Booking not found");
        }
        return org.springframework.http.ResponseEntity.ok(booking);
    }

    private Station findTargetStation(String stationStr) {
        if (stationStr == null || stationStr.trim().isEmpty()) return null;
        String cleanStr = stationStr.trim();

        // 1. Try exact name match
        Station s = stationRepository.findByName(cleanStr);
        if (s != null) return s;

        // 2. If stationStr has location in brackets like "Station Name (City)"
        if (cleanStr.contains(" (")) {
            String baseName = cleanStr.split(" \\(")[0].trim();
            s = stationRepository.findByName(baseName);
            if (s != null) return s;
        }

        // 3. Try case-insensitive matching against all stations
        List<Station> all = stationRepository.findAll();
        for (Station st : all) {
            if (st.getName() != null && (st.getName().equalsIgnoreCase(cleanStr) || cleanStr.toLowerCase().contains(st.getName().toLowerCase()))) {
                return st;
            }
        }

        // 4. Fallback to location lookup
        return stationRepository.findFirstByLocation(cleanStr);
    }

    // ✅ POST booking (Auto-decrements station available slots and sends receipt email)
    @PostMapping
    public Booking createBooking(@RequestBody Booking booking) {
        Booking savedBooking = bookingRepository.save(booking);

        Station station = findTargetStation(booking.getStation());
        if (station != null) {
            if (station.getAvailableSlots() > 0) {
                station.setAvailableSlots(station.getAvailableSlots() - 1);
                stationRepository.save(station);
                System.out.println("[SLOT DECREMENT] Decremented slots for station: " + station.getName() + " (ID: " + station.getId() + "). Remaining: " + station.getAvailableSlots());
            }
        }

        // Send booking creation email receipt asynchronously/safely
        try {
            if (savedBooking.getCustomerEmail() != null && !savedBooking.getCustomerEmail().trim().isEmpty()) {
                new Thread(() -> emailReceiptService.sendBookingReceipt(savedBooking)).start();
            }
        } catch (Exception e) {
            System.err.println("[WARN] Email receipt dispatch failed: " + e.getMessage());
        }

        return savedBooking;
    }

    @PostMapping("/{id}/cancel")
    public org.springframework.http.ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return org.springframework.http.ResponseEntity.status(404).body("Booking not found");
        }

        booking.setPaymentStatus("Cancelled");
        bookingRepository.save(booking);

        // Auto-increment station available slots since booking is cancelled
        Station station = findTargetStation(booking.getStation());
        if (station != null) {
            station.setAvailableSlots(station.getAvailableSlots() + 1);
            stationRepository.save(station);
            System.out.println("[SLOT RECOVERY] Restored slot for station: " + station.getName() + " (ID: " + station.getId() + "). New total: " + station.getAvailableSlots());
        }

        return org.springframework.http.ResponseEntity.ok().body("{\"message\":\"Booking cancelled successfully\"}");
    }

    @PutMapping("/{id}/pay")
    public org.springframework.http.ResponseEntity<?> payBooking(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return org.springframework.http.ResponseEntity.status(404).body("Booking not found");
        }

        String method = (String) payload.get("method");
        booking.setPaymentStatus("Paid");
        if (method != null) {
            booking.setPaymentType(method.toUpperCase());
        }
        Booking updatedBooking = bookingRepository.save(booking);

        // Send payment confirmation receipt email safely
        try {
            new Thread(() -> emailReceiptService.sendBookingReceipt(updatedBooking)).start();
        } catch (Exception e) {
            System.err.println("[WARN] Payment receipt email dispatch failed: " + e.getMessage());
        }

        return org.springframework.http.ResponseEntity.ok(updatedBooking);
    }

    @PostMapping("/{id}/email")
    public org.springframework.http.ResponseEntity<?> resendReceiptEmail(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return org.springframework.http.ResponseEntity.status(404).body("{\"message\":\"Booking not found\"}");
        }

        boolean sent = emailReceiptService.sendBookingReceipt(booking);
        if (sent) {
            return org.springframework.http.ResponseEntity.ok().body("{\"message\":\"Receipt email sent successfully!\"}");
        } else {
            return org.springframework.http.ResponseEntity.ok().body("{\"message\":\"Receipt email process triggered (Check server logs if using simulation mode).\"}");
        }
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id).orElse(null);
        if (booking == null) {
            return org.springframework.http.ResponseEntity.status(404).body("Booking not found");
        }
        bookingRepository.delete(booking);
        return org.springframework.http.ResponseEntity.ok().body("{\"message\":\"Booking deleted successfully\"}");
    }

    @PostMapping("/test")
    public String test() {
        return "POST is working";
    }
}
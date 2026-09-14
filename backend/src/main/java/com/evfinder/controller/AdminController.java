package com.evfinder.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.evfinder.entity.Booking;
import com.evfinder.repository.BookingRepository;
import com.evfinder.repository.StationRepository;

@CrossOrigin(originPatterns = "*")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private StationRepository stationRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalStations = stationRepository.count();
        List<Booking> bookings = bookingRepository.findAll();
        long totalBookings = bookings.size();
        long cancelledBookings = bookings.stream()
                .filter(b -> "CANCELLED".equalsIgnoreCase(b.getPaymentStatus()))
                .count();
        long paidBookings = bookings.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getPaymentStatus()))
                .count();
        long activeBookings = totalBookings - cancelledBookings;

        stats.put("totalStations", totalStations);
        stats.put("totalBookings", totalBookings);
        stats.put("activeBookings", activeBookings);
        stats.put("paidBookings", paidBookings);
        stats.put("cancelledBookings", cancelledBookings);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAllStationBookings() {
        return ResponseEntity.ok(bookingRepository.findAll());
    }
}

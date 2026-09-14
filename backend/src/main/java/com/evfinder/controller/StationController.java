package com.evfinder.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.evfinder.entity.Station;
import com.evfinder.repository.StationRepository;

@RestController
@RequestMapping("/api/stations")
@CrossOrigin(originPatterns = "*")
public class StationController {

    @Autowired
    private StationRepository repository;

    @GetMapping
    public List<Station> getAllStations() {
        return repository.findAll();
    }

    // ADD THIS - creates a new station
    @PostMapping
    public Station addStation(@RequestBody Station station) {
        return repository.save(station);
    }

    // ADD THIS - deletes a station by id
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteStation(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.status(404).body("Station not found");
        }
        repository.deleteById(id);
        return ResponseEntity.ok("Station deleted successfully");
    }

    @PostMapping("/book/{id}")
    public String bookSlot(@PathVariable Long id) {
        Station station = repository.findById(id).orElse(null);

        if (station == null) {
            return "Station not found";
        }

        if (station.getAvailableSlots() <= 0) {
            return "No slots available";
        }

        station.setAvailableSlots(station.getAvailableSlots() - 1);
        repository.save(station);

        return "Booking successful";
    }
}
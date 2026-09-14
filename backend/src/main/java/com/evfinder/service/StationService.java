package com.evfinder.service;

import com.evfinder.entity.Station;
import com.evfinder.repository.StationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StationService {

    @Autowired
    private StationRepository stationRepository;

    // Add a station
    public Station addStation(Station station) {
        return stationRepository.save(station);
    }

    // Get all stations
    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    // Search stations by location
    public List<Station> searchByLocation(String location) {
        return stationRepository.findByLocationContainingIgnoreCase(location);
    }
}
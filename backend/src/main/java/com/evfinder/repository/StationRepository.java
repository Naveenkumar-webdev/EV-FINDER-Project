package com.evfinder.repository;

import com.evfinder.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StationRepository extends JpaRepository<Station, Long> {

    List<Station> findByLocationContainingIgnoreCase(String location);

    Station findByName(String name);

    Station findFirstByLocation(String location);
}
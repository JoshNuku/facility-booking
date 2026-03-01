package com.group5.facility_booking.service;

import com.group5.facility_booking.dto.FacilityRequest;
import com.group5.facility_booking.exception.ResourceNotFoundException;
import com.group5.facility_booking.model.Facility;
import com.group5.facility_booking.repository.FacilityRepository;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public FacilityService(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public Facility getFacilityById(Integer facilityId) {
        Integer safeFacilityId = Objects.requireNonNull(facilityId, "facilityId must not be null");
        return facilityRepository.findById(safeFacilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));
    }

    public Facility createFacility(FacilityRequest request) {
        Facility facility = new Facility();
        facility.setName(request.getName());
        facility.setLocation(request.getLocation());
        facility.setCapacity(request.getCapacity());
        return facilityRepository.save(facility);
    }

    public Facility updateFacility(Integer facilityId, FacilityRequest request) {
        Facility existingFacility = getFacilityById(facilityId);
        existingFacility.setName(request.getName());
        existingFacility.setLocation(request.getLocation());
        existingFacility.setCapacity(request.getCapacity());
        return facilityRepository.save(existingFacility);
    }

    public void deleteFacility(Integer facilityId) {
        Integer safeFacilityId = Objects.requireNonNull(facilityId, "facilityId must not be null");
        if (!facilityRepository.existsById(safeFacilityId)) {
            throw new ResourceNotFoundException("Facility not found with id: " + facilityId);
        }
        facilityRepository.deleteById(safeFacilityId);
    }
}

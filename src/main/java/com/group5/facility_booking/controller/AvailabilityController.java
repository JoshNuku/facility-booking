package com.group5.facility_booking.controller;

import com.group5.facility_booking.service.BookingService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/availability")
public class AvailabilityController {

    private final BookingService bookingService;

    public AvailabilityController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam Integer facilityId,
            @RequestParam LocalDate bookingDate,
            @RequestParam LocalTime startTime,
            @RequestParam LocalTime endTime
    ) {
        boolean available = bookingService.checkAvailability(facilityId, bookingDate, startTime, endTime);
        return ResponseEntity.ok(Map.of(
                "facilityId", facilityId,
                "bookingDate", bookingDate,
                "startTime", startTime,
                "endTime", endTime,
                "available", available
        ));
    }
}

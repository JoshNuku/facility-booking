package com.group5.facility_booking.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.group5.facility_booking.dto.BookingRequest;
import com.group5.facility_booking.dto.BookingStatusUpdateRequest;
import com.group5.facility_booking.exception.BookingConflictException;
import com.group5.facility_booking.exception.ResourceNotFoundException;
import com.group5.facility_booking.model.Booking;
import com.group5.facility_booking.model.BookingStatus;
import com.group5.facility_booking.model.Facility;
import com.group5.facility_booking.model.User;
import com.group5.facility_booking.repository.BookingRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityService facilityService;
    private final UserService userService;

    public BookingService(BookingRepository bookingRepository, FacilityService facilityService, UserService userService) {
        this.bookingRepository = bookingRepository;
        this.facilityService = facilityService;
        this.userService = userService;
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByUserId(Integer userId) {
        return bookingRepository.findByUserId(userId);
    }

    public Booking getBookingById(Integer bookingId) {
        Integer safeBookingId = Objects.requireNonNull(bookingId, "bookingId must not be null");
        return bookingRepository.findById(safeBookingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Booking not found with id: " + bookingId));
    }

    public boolean checkAvailability(Integer facilityId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        validateTimeRange(startTime, endTime);
        boolean hasConflict = bookingRepository.existsConflict(
                facilityId,
                bookingDate,
                startTime,
                endTime,
                BookingStatus.CONFIRMED
        );
        return !hasConflict;
    }

    public Booking createBooking(BookingRequest bookingRequest) {
        validateTimeRange(bookingRequest.getStartTime(), bookingRequest.getEndTime());

        Facility facility = facilityService.getFacilityById(bookingRequest.getFacilityId());
        User user = userService.getUserById(bookingRequest.getUserId());

        boolean available = checkAvailability(
                facility.getId(),
                bookingRequest.getBookingDate(),
                bookingRequest.getStartTime(),
                bookingRequest.getEndTime()
        );

        if (!available) {
            throw new BookingConflictException("Facility is already booked for the selected time slot");
        }

        Booking booking = new Booking();
        booking.setFacility(facility);
        booking.setUser(user);
        booking.setBookingDate(bookingRequest.getBookingDate());
        booking.setStartTime(bookingRequest.getStartTime());
        booking.setEndTime(bookingRequest.getEndTime());
        booking.setStatus(BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    public Booking updateBooking(Integer bookingId, BookingRequest bookingRequest) {
        validateTimeRange(bookingRequest.getStartTime(), bookingRequest.getEndTime());

        Booking existingBooking = getBookingById(bookingId);
        Facility facility = facilityService.getFacilityById(bookingRequest.getFacilityId());
        User user = userService.getUserById(bookingRequest.getUserId());

        boolean hasConflict = bookingRepository.existsConflictExcludingBooking(
                existingBooking.getId(),
                facility.getId(),
                bookingRequest.getBookingDate(),
                bookingRequest.getStartTime(),
                bookingRequest.getEndTime(),
            BookingStatus.CONFIRMED
        );

        if (hasConflict) {
            throw new BookingConflictException("Facility is already booked for the selected time slot");
        }

        existingBooking.setFacility(facility);
        existingBooking.setUser(user);
        existingBooking.setBookingDate(bookingRequest.getBookingDate());
        existingBooking.setStartTime(bookingRequest.getStartTime());
        existingBooking.setEndTime(bookingRequest.getEndTime());
        existingBooking.setStatus(existingBooking.getStatus());

        return bookingRepository.save(existingBooking);
    }

    public Booking updateBookingStatus(Integer bookingId, BookingStatusUpdateRequest request) {
        Booking existingBooking = getBookingById(bookingId);

        if (request.getStatus() == BookingStatus.CONFIRMED) {
            boolean hasConflict = bookingRepository.existsConflictExcludingBooking(
                    existingBooking.getId(),
                    existingBooking.getFacility().getId(),
                    existingBooking.getBookingDate(),
                    existingBooking.getStartTime(),
                    existingBooking.getEndTime(),
                    BookingStatus.CONFIRMED
            );

            if (hasConflict) {
                throw new BookingConflictException("Cannot confirm booking because the slot is already confirmed");
            }
        }

        existingBooking.setStatus(request.getStatus());
        return bookingRepository.save(existingBooking);
    }

    public void cancelBooking(Integer bookingId) {
        Booking existingBooking = getBookingById(bookingId);
        existingBooking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(existingBooking);
    }

    private void validateTimeRange(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("startTime must be before endTime");
        }
    }
}

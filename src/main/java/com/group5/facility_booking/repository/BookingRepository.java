package com.group5.facility_booking.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.group5.facility_booking.model.Booking;
import com.group5.facility_booking.model.BookingStatus;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {

    @Query("""
        SELECT COUNT(b) > 0
        FROM Booking b
        WHERE b.facility.id = :facilityId
          AND b.bookingDate = :bookingDate
          AND b.status = :blockingStatus
          AND b.startTime < :newEndTime
          AND :newStartTime < b.endTime
        """)
    boolean existsConflict(
            @Param("facilityId") Integer facilityId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("newStartTime") LocalTime newStartTime,
            @Param("newEndTime") LocalTime newEndTime,
            @Param("blockingStatus") BookingStatus blockingStatus
    );

    @Query("""
        SELECT COUNT(b) > 0
        FROM Booking b
        WHERE b.id <> :bookingId
          AND b.facility.id = :facilityId
          AND b.bookingDate = :bookingDate
          AND b.status = :blockingStatus
          AND b.startTime < :newEndTime
          AND :newStartTime < b.endTime
        """)
    boolean existsConflictExcludingBooking(
            @Param("bookingId") Integer bookingId,
            @Param("facilityId") Integer facilityId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("newStartTime") LocalTime newStartTime,
            @Param("newEndTime") LocalTime newEndTime,
            @Param("blockingStatus") BookingStatus blockingStatus
    );

    List<Booking> findByUserId(Integer userId);
}

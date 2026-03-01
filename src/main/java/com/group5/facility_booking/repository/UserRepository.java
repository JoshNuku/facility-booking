package com.group5.facility_booking.repository;

import com.group5.facility_booking.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

	boolean existsByEmail(String email);

	boolean existsByEmailAndIdNot(String email, Integer id);

	Optional<User> findByEmail(String email);
}
